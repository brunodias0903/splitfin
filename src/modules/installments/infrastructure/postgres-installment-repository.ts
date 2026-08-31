import { and, desc, eq, isNull, or } from "drizzle-orm";

import { cards, categories, installmentPlans } from "@/shared/db/schema";
import { recordAuditEventSafely } from "@/shared/security/audit";
import {
  InvalidOwnedReferenceError,
  resolveCurrentUserId,
  type ScopedRepositoryDependencies,
} from "@/shared/db/user-scope";

type InstallmentValues = Omit<
  typeof installmentPlans.$inferInsert,
  "id" | "userId" | "createdAt" | "updatedAt"
>;
type InstallmentPatch = Partial<InstallmentValues>;

export function createPostgresInstallmentRepository({
  database,
  resolveUserId = resolveCurrentUserId,
}: ScopedRepositoryDependencies) {
  async function assertReferences(
    values: Pick<InstallmentPatch, "cardId" | "categoryId">,
    userId: string,
  ) {
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
  }

  return {
    async list() {
      const userId = await resolveUserId();
      return database
        .select()
        .from(installmentPlans)
        .where(eq(installmentPlans.userId, userId))
        .orderBy(desc(installmentPlans.createdAt));
    },

    async findById(id: string) {
      const userId = await resolveUserId();
      const [plan] = await database
        .select()
        .from(installmentPlans)
        .where(and(eq(installmentPlans.id, id), eq(installmentPlans.userId, userId)))
        .limit(1);
      return plan ?? null;
    },

    async create(values: InstallmentValues) {
      const userId = await resolveUserId();
      await assertReferences(values, userId);
      const [plan] = await database
        .insert(installmentPlans)
        .values({ ...values, userId })
        .returning();
      await recordAuditEventSafely(database, {
        actorUserId: userId,
        action: "finance.installment.created",
        entityType: "installment_plan",
        entityId: plan.id,
      });
      return plan;
    },

    async update(id: string, values: InstallmentPatch) {
      const userId = await resolveUserId();
      await assertReferences(values, userId);
      const [plan] = await database
        .update(installmentPlans)
        .set({ ...values, userId, updatedAt: new Date() })
        .where(and(eq(installmentPlans.id, id), eq(installmentPlans.userId, userId)))
        .returning();
      await recordAuditEventSafely(database, {
        actorUserId: userId,
        action: "finance.installment.updated",
        outcome: plan ? "success" : "denied",
        entityType: "installment_plan",
        entityId: id,
      });
      return plan ?? null;
    },

    async remove(id: string) {
      const userId = await resolveUserId();
      const [plan] = await database
        .delete(installmentPlans)
        .where(and(eq(installmentPlans.id, id), eq(installmentPlans.userId, userId)))
        .returning({ id: installmentPlans.id });
      await recordAuditEventSafely(database, {
        actorUserId: userId,
        action: "finance.installment.deleted",
        outcome: plan ? "success" : "denied",
        entityType: "installment_plan",
        entityId: id,
      });
      return Boolean(plan);
    },
  };
}
