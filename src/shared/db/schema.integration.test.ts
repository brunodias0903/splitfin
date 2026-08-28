import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { closeDatabase, getDatabase } from "./client";
import { accounts, cards, categories, expenses, installmentPlans, users } from "./schema";

const database = getDatabase();
const userId = "10000000-0000-4000-8000-000000000001";

beforeAll(async () => {
  await migrate(database, { migrationsFolder: "drizzle" });
});

afterAll(async () => {
  await database.delete(users).where(eq(users.id, userId));
  await closeDatabase();
});

describe("PostgreSQL schema", () => {
  it("persists a complete installment expense graph using integer cents", async () => {
    await database.insert(users).values({
      id: userId,
      email: "integration@splitfin.local",
      name: "Integration test",
    });

    const [account] = await database
      .insert(accounts)
      .values({ userId, name: "Conta teste", type: "checking" })
      .returning();
    const [category] = await database
      .insert(categories)
      .values({ userId, name: "Tecnologia", slug: "tecnologia", colorToken: "primary" })
      .returning();
    const [card] = await database
      .insert(cards)
      .values({
        userId,
        accountId: account.id,
        name: "Cartão teste",
        lastFourDigits: "4242",
        type: "credit",
        closingDay: 5,
        dueDay: 12,
      })
      .returning();
    const [plan] = await database
      .insert(installmentPlans)
      .values({
        userId,
        cardId: card.id,
        categoryId: category.id,
        description: "Notebook",
        totalAmountCents: 750_000,
        totalInstallments: 10,
        startsOn: "2026-08-01",
      })
      .returning();
    const [expense] = await database
      .insert(expenses)
      .values({
        userId,
        accountId: account.id,
        cardId: card.id,
        categoryId: category.id,
        installmentPlanId: plan.id,
        installmentNumber: 1,
        description: "Notebook — 1/10",
        amountCents: 75_000,
        paymentType: "credit_card",
        occurredAt: new Date("2026-08-15T12:00:00.000Z"),
      })
      .returning();

    expect(expense.amountCents).toBe(75_000);
    expect(plan.totalAmountCents).toBe(750_000);
  });

  it("rejects invalid financial and installment values", async () => {
    await expect(
      database.insert(expenses).values({
        userId,
        description: "Valor inválido",
        amountCents: 0,
        paymentType: "pix",
        occurredAt: new Date(),
      }),
    ).rejects.toThrow();

    await expect(
      database.insert(installmentPlans).values({
        userId,
        description: "Parcelamento inválido",
        totalAmountCents: 1_000,
        totalInstallments: 2,
        paidInstallments: 3,
        startsOn: "2026-08-01",
      }),
    ).rejects.toThrow();
  });
});
