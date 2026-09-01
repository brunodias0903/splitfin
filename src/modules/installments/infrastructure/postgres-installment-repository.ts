import { and, desc, eq, isNull, or } from "drizzle-orm";

import { getInstallmentDate } from "../domain/installment-calculations";
import { cards, categories, expenses, installmentPlans } from "@/shared/db/schema";
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
        .where(and(eq(cards.id, values.cardId), eq(cards.userId, userId), isNull(cards.archivedAt)))
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
        .where(and(eq(installmentPlans.userId, userId), isNull(installmentPlans.archivedAt)))
        .orderBy(desc(installmentPlans.createdAt));
    },

    async listDetailed() {
      const userId = await resolveUserId();
      return database
        .select({
          id: installmentPlans.id,
          description: installmentPlans.description,
          totalAmountCents: installmentPlans.totalAmountCents,
          totalInstallments: installmentPlans.totalInstallments,
          paidInstallments: installmentPlans.paidInstallments,
          startsOn: installmentPlans.startsOn,
          cardId: installmentPlans.cardId,
          categorySlug: categories.slug,
        })
        .from(installmentPlans)
        .leftJoin(categories, eq(installmentPlans.categoryId, categories.id))
        .where(and(eq(installmentPlans.userId, userId), isNull(installmentPlans.archivedAt)))
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
        .where(
          and(
            eq(installmentPlans.id, id),
            eq(installmentPlans.userId, userId),
            isNull(installmentPlans.archivedAt),
          ),
        )
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

    async archive(id: string) {
      const userId = await resolveUserId();
      const [plan] = await database
        .update(installmentPlans)
        .set({ archivedAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(installmentPlans.id, id),
            eq(installmentPlans.userId, userId),
            isNull(installmentPlans.archivedAt),
          ),
        )
        .returning({ id: installmentPlans.id });
      await recordAuditEventSafely(database, {
        actorUserId: userId,
        action: "finance.installment.archived",
        outcome: plan ? "success" : "denied",
        entityType: "installment_plan",
        entityId: id,
      });
      return Boolean(plan);
    },

    async payNext(id: string, expectedPaidInstallments: number) {
      const userId = await resolveUserId();
      const result = await database.transaction(async (transaction) => {
        const [current] = await transaction
          .select()
          .from(installmentPlans)
          .where(
            and(
              eq(installmentPlans.id, id),
              eq(installmentPlans.userId, userId),
              isNull(installmentPlans.archivedAt),
            ),
          )
          .limit(1);
        if (
          !current ||
          current.paidInstallments !== expectedPaidInstallments ||
          current.paidInstallments >= current.totalInstallments
        )
          return current ?? null;

        const installmentNumber = current.paidInstallments + 1;
        const [updated] = await transaction
          .update(installmentPlans)
          .set({ paidInstallments: installmentNumber, updatedAt: new Date() })
          .where(
            and(
              eq(installmentPlans.id, id),
              eq(installmentPlans.userId, userId),
              eq(installmentPlans.paidInstallments, current.paidInstallments),
            ),
          )
          .returning();
        if (!updated) {
          const [latest] = await transaction
            .select()
            .from(installmentPlans)
            .where(and(eq(installmentPlans.id, id), eq(installmentPlans.userId, userId)))
            .limit(1);
          return latest ?? null;
        }

        const baseAmount = Math.floor(current.totalAmountCents / current.totalInstallments);
        const remainder = current.totalAmountCents % current.totalInstallments;
        const amountCents = baseAmount + (installmentNumber <= remainder ? 1 : 0);
        const date = getInstallmentDate(current.startsOn, installmentNumber - 1);

        await transaction.insert(expenses).values({
          userId,
          cardId: current.cardId,
          categoryId: current.categoryId,
          installmentPlanId: current.id,
          installmentNumber,
          description: `${current.description} (${installmentNumber}/${current.totalInstallments})`,
          amountCents,
          paymentType: current.cardId ? "credit_card" : "other",
          occurredAt: new Date(`${date}T12:00:00-04:00`),
        });
        return updated;
      });

      await recordAuditEventSafely(database, {
        actorUserId: userId,
        action: "finance.installment.paid",
        outcome: result ? "success" : "denied",
        entityType: "installment_plan",
        entityId: id,
      });
      return result;
    },
  };
}
