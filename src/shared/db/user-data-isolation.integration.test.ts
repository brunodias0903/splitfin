import { eq, inArray } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPostgresAccountRepository } from "@/modules/accounts/infrastructure/postgres-account-repository";
import { createPostgresCardRepository } from "@/modules/cards/infrastructure/postgres-card-repository";
import { createPostgresCategoryRepository } from "@/modules/categories/infrastructure/postgres-category-repository";
import { createPostgresExpenseRepository } from "@/modules/expenses/infrastructure/postgres-expense-repository";
import { createPostgresInstallmentRepository } from "@/modules/installments/infrastructure/postgres-installment-repository";
import { InvalidOwnedReferenceError } from "@/shared/db/user-scope";

import { closeDatabase, getDatabase } from "./client";
import { categories, expenses, securityAuditEvents, users } from "./schema";

const database = getDatabase();
const aliceId = "20000000-0000-4000-8000-000000000001";
const bobId = "20000000-0000-4000-8000-000000000002";
const systemCategoryId = "20000000-0000-4000-8000-000000000003";
const testUserIds = [aliceId, bobId];
const forUser = (userId: string) => async () => userId;

const alice = {
  accounts: createPostgresAccountRepository({ database, resolveUserId: forUser(aliceId) }),
  cards: createPostgresCardRepository({ database, resolveUserId: forUser(aliceId) }),
  categories: createPostgresCategoryRepository({ database, resolveUserId: forUser(aliceId) }),
  expenses: createPostgresExpenseRepository({ database, resolveUserId: forUser(aliceId) }),
  installments: createPostgresInstallmentRepository({ database, resolveUserId: forUser(aliceId) }),
};

const bob = {
  accounts: createPostgresAccountRepository({ database, resolveUserId: forUser(bobId) }),
  cards: createPostgresCardRepository({ database, resolveUserId: forUser(bobId) }),
  categories: createPostgresCategoryRepository({ database, resolveUserId: forUser(bobId) }),
  expenses: createPostgresExpenseRepository({ database, resolveUserId: forUser(bobId) }),
  installments: createPostgresInstallmentRepository({ database, resolveUserId: forUser(bobId) }),
};

beforeAll(async () => {
  await migrate(database, { migrationsFolder: "drizzle" });
  await database.delete(securityAuditEvents);
  await database.delete(users).where(inArray(users.id, testUserIds));
  await database.insert(users).values([
    { id: aliceId, email: "alice-isolation@splitfin.local", name: "Alice" },
    { id: bobId, email: "bob-isolation@splitfin.local", name: "Bob" },
  ]);
  await database
    .insert(categories)
    .values({
      id: systemCategoryId,
      name: "System category",
      slug: "isolation-system-category",
      colorToken: "primary",
    })
    .onConflictDoNothing();
});

afterAll(async () => {
  await database.delete(securityAuditEvents);
  await database.delete(users).where(inArray(users.id, testUserIds));
  await database.delete(categories).where(eq(categories.id, systemCategoryId));
  await closeDatabase();
});

describe("PostgreSQL user data isolation", () => {
  it("scopes account reads, updates, and deletes to the authenticated user", async () => {
    const aliceAccount = await alice.accounts.create({ name: "Alice account", type: "checking" });
    const bobAccount = await bob.accounts.create({ name: "Bob account", type: "checking" });

    expect((await alice.accounts.list()).map(({ id }) => id)).toContain(aliceAccount.id);
    expect((await alice.accounts.list()).map(({ id }) => id)).not.toContain(bobAccount.id);
    await expect(alice.accounts.findById(bobAccount.id)).resolves.toBeNull();
    await expect(alice.accounts.update(bobAccount.id, { name: "Taken" })).resolves.toBeNull();
    await expect(alice.accounts.remove(bobAccount.id)).resolves.toBe(false);
    await expect(bob.accounts.findById(bobAccount.id)).resolves.toMatchObject({
      name: "Bob account",
    });
  });

  it("allows global categories to be read but never mutated by a user", async () => {
    const aliceCategory = await alice.categories.create({
      name: "Alice category",
      slug: "alice-category",
      colorToken: "primary",
    });
    const bobCategory = await bob.categories.create({
      name: "Bob category",
      slug: "bob-category",
      colorToken: "warning",
    });

    expect((await alice.categories.list()).map(({ id }) => id)).toContain(aliceCategory.id);
    expect((await alice.categories.list()).map(({ id }) => id)).toContain(systemCategoryId);
    expect((await alice.categories.list()).map(({ id }) => id)).not.toContain(bobCategory.id);
    await expect(alice.categories.update(systemCategoryId, { name: "Taken" })).resolves.toBeNull();
    await expect(alice.categories.remove(systemCategoryId)).resolves.toBe(false);
    await expect(alice.categories.update(bobCategory.id, { name: "Taken" })).resolves.toBeNull();
    await expect(alice.categories.remove(bobCategory.id)).resolves.toBe(false);
  });

  it("always assigns ownership from the authenticated user resolver", async () => {
    const account = await alice.accounts.create({
      name: "Resolver-owned account",
      type: "checking",
      userId: bobId,
    } as never);

    expect(account.userId).toBe(aliceId);
    await expect(
      alice.accounts.update(account.id, { name: "Still resolver-owned", userId: bobId } as never),
    ).resolves.toMatchObject({ userId: aliceId });
  });

  it("scopes cards and rejects accounts owned by another user", async () => {
    const aliceAccount = await alice.accounts.create({
      name: "Alice card account",
      type: "checking",
    });
    const bobAccount = await bob.accounts.create({ name: "Bob card account", type: "checking" });
    const bobCard = await bob.cards.create({
      accountId: bobAccount.id,
      name: "Bob card",
      lastFourDigits: "2222",
      type: "credit",
      closingDay: 5,
      dueDay: 12,
    });

    await expect(
      alice.cards.create({
        accountId: bobAccount.id,
        name: "Cross-user card",
        lastFourDigits: "9999",
        type: "credit",
        closingDay: 5,
        dueDay: 12,
      }),
    ).rejects.toBeInstanceOf(InvalidOwnedReferenceError);
    await expect(alice.cards.findById(bobCard.id)).resolves.toBeNull();
    await expect(
      alice.cards.update(bobCard.id, { accountId: aliceAccount.id }),
    ).resolves.toBeNull();
    await expect(alice.cards.remove(bobCard.id)).resolves.toBe(false);
  });

  it("scopes installment plans and rejects cards owned by another user", async () => {
    const bobCard = await bob.cards.create({
      name: "Bob installments card",
      lastFourDigits: "3333",
      type: "credit",
      closingDay: 6,
      dueDay: 13,
    });
    const bobPlan = await bob.installments.create({
      cardId: bobCard.id,
      description: "Bob plan",
      totalAmountCents: 12_000,
      totalInstallments: 3,
      startsOn: "2026-08-01",
    });

    await expect(
      alice.installments.create({
        cardId: bobCard.id,
        description: "Cross-user plan",
        totalAmountCents: 12_000,
        totalInstallments: 3,
        startsOn: "2026-08-01",
      }),
    ).rejects.toBeInstanceOf(InvalidOwnedReferenceError);
    await expect(alice.installments.findById(bobPlan.id)).resolves.toBeNull();
    await expect(
      alice.installments.update(bobPlan.id, { description: "Taken" }),
    ).resolves.toBeNull();
    await expect(alice.installments.remove(bobPlan.id)).resolves.toBe(false);
  });

  it("pays installments atomically and treats a repeated expected state as idempotent", async () => {
    const card = await alice.cards.create({
      name: "Alice idempotent card",
      lastFourDigits: "4444",
      type: "credit",
      closingDay: 7,
      dueDay: 14,
    });
    const plan = await alice.installments.create({
      cardId: card.id,
      description: "Idempotent plan",
      totalAmountCents: 10_000,
      totalInstallments: 3,
      startsOn: "2026-09-01",
    });

    await Promise.all([
      alice.installments.payNext(plan.id, 0),
      alice.installments.payNext(plan.id, 0),
    ]);

    await expect(alice.installments.findById(plan.id)).resolves.toMatchObject({
      paidInstallments: 1,
    });
    const generated = await database
      .select()
      .from(expenses)
      .where(eq(expenses.installmentPlanId, plan.id));
    expect(generated).toHaveLength(1);
    expect(generated[0]).toMatchObject({
      installmentNumber: 1,
      amountCents: 3_334,
      cardId: card.id,
    });

    await expect(alice.installments.archive(plan.id)).resolves.toBe(true);
    expect((await alice.installments.list()).map(({ id }) => id)).not.toContain(plan.id);
    await expect(alice.cards.archive(card.id)).resolves.toBe(true);
    expect((await alice.cards.list()).map(({ id }) => id)).not.toContain(card.id);
    await expect(alice.cards.update(card.id, { dueDay: 20 })).resolves.toBeNull();
    await expect(
      alice.expenses.create({
        cardId: card.id,
        description: "Archived card expense",
        amountCents: 1_000,
        paymentType: "credit_card",
        occurredAt: new Date("2026-09-01T12:00:00.000Z"),
      }),
    ).rejects.toBeInstanceOf(InvalidOwnedReferenceError);
    await expect(
      alice.installments.create({
        cardId: card.id,
        description: "Archived card plan",
        totalAmountCents: 2_000,
        totalInstallments: 2,
        startsOn: "2026-09-01",
      }),
    ).rejects.toBeInstanceOf(InvalidOwnedReferenceError);
  });

  it("scopes expenses and rejects every cross-user financial reference", async () => {
    const bobAccount = await bob.accounts.create({ name: "Bob expense account", type: "checking" });
    const bobExpense = await bob.expenses.create({
      accountId: bobAccount.id,
      description: "Bob expense",
      amountCents: 2_500,
      paymentType: "pix",
      occurredAt: new Date("2026-08-31T12:00:00.000Z"),
    });

    await expect(
      alice.expenses.create({
        accountId: bobAccount.id,
        description: "Cross-user expense",
        amountCents: 2_500,
        paymentType: "pix",
        occurredAt: new Date("2026-08-31T12:00:00.000Z"),
      }),
    ).rejects.toBeInstanceOf(InvalidOwnedReferenceError);
    await expect(alice.expenses.findById(bobExpense.id)).resolves.toBeNull();
    await expect(
      alice.expenses.update(bobExpense.id, { description: "Taken" }),
    ).resolves.toBeNull();
    await expect(alice.expenses.remove(bobExpense.id)).resolves.toBe(false);
    await expect(bob.expenses.findById(bobExpense.id)).resolves.toMatchObject({
      description: "Bob expense",
    });
  });

  it("paginates, filters, orders, and aggregates expenses inside the user scope", async () => {
    await Promise.all(
      [
        ["Older", 1_000, "2026-08-01T12:00:00.000Z"],
        ["Middle", 2_000, "2026-08-15T12:00:00.000Z"],
        ["Newer", 3_000, "2026-08-31T12:00:00.000Z"],
      ].map(([description, amountCents, occurredAt]) =>
        alice.expenses.create({
          categoryId: systemCategoryId,
          description: description as string,
          amountCents: amountCents as number,
          paymentType: "boleto",
          occurredAt: new Date(occurredAt as string),
        }),
      ),
    );

    const firstPage = await alice.expenses.listPage({
      page: 1,
      pageSize: 2,
      categorySlug: "isolation-system-category",
      order: "oldest",
    });
    const secondPage = await alice.expenses.listPage({
      page: 2,
      pageSize: 2,
      categorySlug: "isolation-system-category",
      order: "oldest",
    });

    expect(firstPage.items.map(({ description }) => description)).toEqual(["Older", "Middle"]);
    expect(secondPage.items.map(({ description }) => description)).toEqual(["Newer"]);
    expect(firstPage.totalItems).toBe(3);
    expect(firstPage.totalAmountCents).toBe(6_000);
    expect(
      firstPage.items.every(({ categorySlug }) => categorySlug === "isolation-system-category"),
    ).toBe(true);
  });

  it("audits successful and denied financial mutations without financial payloads", async () => {
    const events = await database
      .select()
      .from(securityAuditEvents)
      .where(eq(securityAuditEvents.actorUserId, aliceId));

    expect(events.some(({ outcome }) => outcome === "success")).toBe(true);
    expect(events.some(({ outcome }) => outcome === "denied")).toBe(true);
    expect(events.every(({ metadata }) => metadata == null)).toBe(true);
  });
});
