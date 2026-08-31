import { and, desc, eq, isNull, or } from "drizzle-orm";

import { accounts, cards, categories, expenses, installmentPlans } from "@/shared/db/schema";
import { recordAuditEventSafely } from "@/shared/security/audit";
import {
  InvalidOwnedReferenceError,
  resolveCurrentUserId,
  type ScopedRepositoryDependencies,
} from "@/shared/db/user-scope";

type ExpenseValues = Omit<
  typeof expenses.$inferInsert,
  "id" | "userId" | "createdAt" | "updatedAt"
>;
type ExpensePatch = Partial<ExpenseValues>;

export function createPostgresExpenseRepository({
  database,
  resolveUserId = resolveCurrentUserId,
}: ScopedRepositoryDependencies) {
  async function assertReferences(values: ExpensePatch, userId: string) {
    if (values.accountId) {
      const [account] = await database
        .select({ id: accounts.id })
        .from(accounts)
        .where(and(eq(accounts.id, values.accountId), eq(accounts.userId, userId)))
        .limit(1);
      if (!account) throw new InvalidOwnedReferenceError("account");
    }

    if (values.cardId) {
      const [card] = await database
        .select({ id: cards.id })
        .from(cards)
        .where(and(eq(cards.id, values.cardId), eq(cards.userId, userId)))
        .limit(1);
      if (!card) throw new InvalidOwnedReferenceError("card");
    }

    if (values.categoryId) {
      const [category] = await database
        .select({ id: categories.id })
        .from(categories)
        .where(
          and(
            eq(categories.id, values.categoryId),
            or(eq(categories.userId, userId), isNull(categories.userId)),
          ),
        )
        .limit(1);
      if (!category) throw new InvalidOwnedReferenceError("category");
    }

    if (values.installmentPlanId) {
      const [plan] = await database
        .select({ id: installmentPlans.id })
        .from(installmentPlans)
        .where(
          and(
            eq(installmentPlans.id, values.installmentPlanId),
            eq(installmentPlans.userId, userId),
          ),
        )
        .limit(1);
      if (!plan) throw new InvalidOwnedReferenceError("installment plan");
    }
  }

  return {
    async list() {
      const userId = await resolveUserId();
      return database
        .select()
        .from(expenses)
        .where(eq(expenses.userId, userId))
        .orderBy(desc(expenses.occurredAt));
    },

    async findById(id: string) {
      const userId = await resolveUserId();
      const [expense] = await database
        .select()
        .from(expenses)
        .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
        .limit(1);
      return expense ?? null;
    },

    async create(values: ExpenseValues) {
      const userId = await resolveUserId();
      await assertReferences(values, userId);
      const [expense] = await database
        .insert(expenses)
        .values({ ...values, userId })
        .returning();
      await recordAuditEventSafely(database, {
        actorUserId: userId,
        action: "finance.expense.created",
        entityType: "expense",
        entityId: expense.id,
      });
      return expense;
    },

    async update(id: string, values: ExpensePatch) {
      const userId = await resolveUserId();
      await assertReferences(values, userId);
      const [expense] = await database
        .update(expenses)
        .set({ ...values, userId, updatedAt: new Date() })
        .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
        .returning();
      await recordAuditEventSafely(database, {
        actorUserId: userId,
        action: "finance.expense.updated",
        outcome: expense ? "success" : "denied",
        entityType: "expense",
        entityId: id,
      });
      return expense ?? null;
    },

    async remove(id: string) {
      const userId = await resolveUserId();
      const [expense] = await database
        .delete(expenses)
        .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
        .returning({ id: expenses.id });
      await recordAuditEventSafely(database, {
        actorUserId: userId,
        action: "finance.expense.deleted",
        outcome: expense ? "success" : "denied",
        entityType: "expense",
        entityId: id,
      });
      return Boolean(expense);
    },
  };
}
