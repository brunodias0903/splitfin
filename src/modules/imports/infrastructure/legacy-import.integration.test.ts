import { count, eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { closeDatabase, getDatabase } from "@/shared/db/client";
import {
  cards,
  expenses,
  installmentPlans,
  legacyImportBatches,
  securityAuditEvents,
  users,
} from "@/shared/db/schema";
import { importLegacyDataForUser } from "./legacy-import-service";

const database = getDatabase();
const firstUserId = "40000000-0000-4000-8000-000000000001";
const secondUserId = "40000000-0000-4000-8000-000000000002";

const payload = {
  cards: [
    {
      id: "legacy-card",
      name: "Principal",
      last4: "4242",
      type: "credit",
      closingDay: 5,
      dueDay: 12,
    },
  ],
  expenses: [
    {
      id: "legacy-expense",
      description: "Mercado legado",
      amount: 42.5,
      category: "Food",
      paymentType: "credit",
      cardId: "legacy-card",
      date: "2026-09-01",
    },
  ],
  fixedExpenses: [
    {
      id: "legacy-plan",
      description: "Notebook legado",
      totalAmount: 300,
      totalInstallments: 3,
      paidInstallments: 1,
      category: "Shopping",
      startDate: "2026-09-01",
      active: true,
      cardId: "legacy-card",
    },
  ],
};

beforeAll(async () => {
  await migrate(database, { migrationsFolder: "drizzle" });
  await database.delete(users).where(eq(users.id, firstUserId));
  await database.delete(users).where(eq(users.id, secondUserId));
  await database.insert(users).values([
    { id: firstUserId, name: "Import one", email: "import-one@splitfin.local" },
    { id: secondUserId, name: "Import two", email: "import-two@splitfin.local" },
  ]);
});

afterAll(async () => {
  await database
    .delete(securityAuditEvents)
    .where(eq(securityAuditEvents.actorUserId, firstUserId));
  await database
    .delete(securityAuditEvents)
    .where(eq(securityAuditEvents.actorUserId, secondUserId));
  await database.delete(users).where(eq(users.id, firstUserId));
  await database.delete(users).where(eq(users.id, secondUserId));
  await closeDatabase();
});

describe("legacy import persistence", () => {
  it("is idempotent by batch and by legacy item while preserving user scope", async () => {
    const first = await importLegacyDataForUser(payload, firstUserId, database);
    expect(first).toMatchObject({
      duplicateBatch: false,
      imported: { cards: 1, expenses: 1, installments: 1 },
      conflicts: 0,
    });

    const duplicate = await importLegacyDataForUser(payload, firstUserId, database);
    expect(duplicate).toMatchObject({
      duplicateBatch: true,
      imported: { cards: 1, expenses: 1, installments: 1 },
    });

    const modified = await importLegacyDataForUser(
      {
        ...payload,
        expenses: [
          ...payload.expenses,
          {
            ...payload.expenses[0],
            id: "legacy-expense-two",
            description: "Transporte legado",
            category: "Transport",
          },
        ],
      },
      firstUserId,
      database,
    );
    expect(modified).toMatchObject({
      duplicateBatch: false,
      imported: { cards: 0, expenses: 1, installments: 0 },
      conflicts: 3,
    });

    const secondUser = await importLegacyDataForUser(payload, secondUserId, database);
    expect(secondUser.imported).toEqual({ cards: 1, expenses: 1, installments: 1 });

    const [[firstCards], [firstExpenses], [firstPlans], [firstBatches]] = await Promise.all([
      database.select({ value: count() }).from(cards).where(eq(cards.userId, firstUserId)),
      database.select({ value: count() }).from(expenses).where(eq(expenses.userId, firstUserId)),
      database
        .select({ value: count() })
        .from(installmentPlans)
        .where(eq(installmentPlans.userId, firstUserId)),
      database
        .select({ value: count() })
        .from(legacyImportBatches)
        .where(eq(legacyImportBatches.userId, firstUserId)),
    ]);
    expect({
      cards: firstCards.value,
      expenses: firstExpenses.value,
      installments: firstPlans.value,
      batches: firstBatches.value,
    }).toEqual({ cards: 1, expenses: 2, installments: 1, batches: 2 });
  });
});
