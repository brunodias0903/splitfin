import "server-only";

import { createHash } from "node:crypto";
import { and, eq, isNull, or } from "drizzle-orm";

import {
  categoryToSlug,
  expenseDateTimeToDatabase,
  paymentTypeToDatabase,
} from "@/modules/expenses/application/persisted-expense";
import { parseLegacyImport, serializeLegacyPayload } from "../application/legacy-import";
import { getDatabase } from "@/shared/db/client";
import type { Database } from "@/shared/db/client";
import {
  cards,
  categories,
  expenses,
  installmentPlans,
  legacyImportBatches,
  legacyImportItems,
} from "@/shared/db/schema";
import { resolveCurrentUserId } from "@/shared/db/user-scope";
import { recordAuditEventSafely } from "@/shared/security/audit";

export interface LegacyImportResult {
  key: string;
  duplicateBatch: boolean;
  imported: { cards: number; expenses: number; installments: number };
  invalid: { cards: number; expenses: number; installments: number };
  conflicts: number;
  detachedCardReferences: number;
}

const itemKey = (kind: string, sourceId: string) => `${kind}:${sourceId}`;

export async function importLegacyData(value: unknown): Promise<LegacyImportResult> {
  const userId = await resolveCurrentUserId();
  return importLegacyDataForUser(value, userId);
}

export async function importLegacyDataForUser(
  value: unknown,
  userId: string,
  database: Database = getDatabase(),
): Promise<LegacyImportResult> {
  const serialized = serializeLegacyPayload(value);
  if (serialized.length > 5_000_000) throw new Error("Legacy import payload is too large.");
  const parsed = parseLegacyImport(value);
  if (
    parsed.cards.length + parsed.invalid.cards > 5_000 ||
    parsed.expenses.length + parsed.invalid.expenses > 5_000 ||
    parsed.installments.length + parsed.invalid.installments > 5_000
  ) {
    throw new Error("Legacy import contains too many records.");
  }
  const key = createHash("sha256").update(serialized).digest("hex");

  const result = await database.transaction(async (transaction) => {
    const [batch] = await transaction
      .insert(legacyImportBatches)
      .values({ userId, idempotencyKey: key })
      .onConflictDoNothing()
      .returning();

    if (!batch) {
      const [existing] = await transaction
        .select()
        .from(legacyImportBatches)
        .where(
          and(eq(legacyImportBatches.userId, userId), eq(legacyImportBatches.idempotencyKey, key)),
        )
        .limit(1);
      if (!existing) throw new Error("Legacy import idempotency conflict could not be resolved.");
      return {
        key,
        duplicateBatch: true,
        imported: {
          cards: existing.importedCards,
          expenses: existing.importedExpenses,
          installments: existing.importedInstallments,
        },
        invalid: parsed.invalid,
        conflicts: Math.max(
          0,
          existing.skippedItems -
            parsed.invalid.cards -
            parsed.invalid.expenses -
            parsed.invalid.installments,
        ),
        detachedCardReferences: 0,
      } satisfies LegacyImportResult;
    }

    const [existingItems, activeCards, availableCategories] = await Promise.all([
      transaction.select().from(legacyImportItems).where(eq(legacyImportItems.userId, userId)),
      transaction
        .select({ id: cards.id })
        .from(cards)
        .where(and(eq(cards.userId, userId), isNull(cards.archivedAt))),
      transaction
        .select({ id: categories.id, slug: categories.slug, userId: categories.userId })
        .from(categories)
        .where(or(eq(categories.userId, userId), isNull(categories.userId))),
    ]);
    const existing = new Map(
      existingItems.map((item) => [itemKey(item.sourceKind, item.sourceId), item.targetId]),
    );
    const activeCardIds = new Set(activeCards.map(({ id }) => id));
    const cardTargets = new Map<string, string>();
    for (const item of existingItems) {
      if (item.sourceKind === "card" && activeCardIds.has(item.targetId)) {
        cardTargets.set(item.sourceId, item.targetId);
      }
    }
    const categoryIds = new Map<string, string>();
    for (const category of availableCategories.sort((a, b) =>
      a.userId === b.userId ? 0 : a.userId === null ? -1 : 1,
    )) {
      categoryIds.set(category.slug, category.id);
    }

    let importedCards = 0;
    let importedExpenses = 0;
    let importedInstallments = 0;
    let conflicts = 0;
    let detachedCardReferences = 0;

    for (const item of parsed.cards) {
      if (existing.has(itemKey("card", item.sourceId))) {
        conflicts += 1;
        continue;
      }
      const [created] = await transaction
        .insert(cards)
        .values({
          userId,
          name: item.data.name,
          lastFourDigits: item.data.last4,
          type: item.data.type,
          closingDay: item.data.closingDay,
          dueDay: item.data.dueDay,
        })
        .returning({ id: cards.id });
      await transaction.insert(legacyImportItems).values({
        batchId: batch.id,
        userId,
        sourceKind: "card",
        sourceId: item.sourceId,
        targetId: created.id,
      });
      existing.set(itemKey("card", item.sourceId), created.id);
      cardTargets.set(item.sourceId, created.id);
      importedCards += 1;
    }

    for (const item of parsed.expenses) {
      if (existing.has(itemKey("expense", item.sourceId))) {
        conflicts += 1;
        continue;
      }
      const cardId = item.sourceCardId ? cardTargets.get(item.sourceCardId) : undefined;
      if (item.sourceCardId && !cardId) detachedCardReferences += 1;
      const categoryId = categoryIds.get(categoryToSlug(item.data.category));
      if (!categoryId) throw new Error("Canonical import category is missing.");
      const [created] = await transaction
        .insert(expenses)
        .values({
          userId,
          cardId: cardId ?? null,
          categoryId,
          description: item.data.description,
          amountCents: Math.round(item.data.amount * 100),
          paymentType: paymentTypeToDatabase(item.data.paymentType),
          occurredAt: expenseDateTimeToDatabase(item.data.date, item.data.time),
        })
        .returning({ id: expenses.id });
      await transaction.insert(legacyImportItems).values({
        batchId: batch.id,
        userId,
        sourceKind: "expense",
        sourceId: item.sourceId,
        targetId: created.id,
      });
      existing.set(itemKey("expense", item.sourceId), created.id);
      importedExpenses += 1;
    }

    for (const item of parsed.installments) {
      if (existing.has(itemKey("installment", item.sourceId))) {
        conflicts += 1;
        continue;
      }
      const cardId = item.sourceCardId ? cardTargets.get(item.sourceCardId) : undefined;
      if (item.sourceCardId && !cardId) detachedCardReferences += 1;
      const categoryId = categoryIds.get(categoryToSlug(item.data.category));
      if (!categoryId) throw new Error("Canonical import category is missing.");
      const [created] = await transaction
        .insert(installmentPlans)
        .values({
          userId,
          cardId: cardId ?? null,
          categoryId,
          description: item.data.description,
          totalAmountCents: Math.round(item.data.totalAmount * 100),
          totalInstallments: item.data.totalInstallments,
          paidInstallments: item.data.paidInstallments,
          startsOn: item.data.startDate,
        })
        .returning({ id: installmentPlans.id });
      await transaction.insert(legacyImportItems).values({
        batchId: batch.id,
        userId,
        sourceKind: "installment",
        sourceId: item.sourceId,
        targetId: created.id,
      });
      existing.set(itemKey("installment", item.sourceId), created.id);
      importedInstallments += 1;
    }

    const invalid = parsed.invalid.cards + parsed.invalid.expenses + parsed.invalid.installments;
    await transaction
      .update(legacyImportBatches)
      .set({
        importedCards,
        importedExpenses,
        importedInstallments,
        skippedItems: invalid + conflicts,
      })
      .where(eq(legacyImportBatches.id, batch.id));

    return {
      key,
      duplicateBatch: false,
      imported: {
        cards: importedCards,
        expenses: importedExpenses,
        installments: importedInstallments,
      },
      invalid: parsed.invalid,
      conflicts,
      detachedCardReferences,
    } satisfies LegacyImportResult;
  });

  if (!result.duplicateBatch) {
    await recordAuditEventSafely(database, {
      actorUserId: userId,
      action: "finance.legacy_import.created",
      entityType: "legacy_import_batch",
      metadata: {
        cards: result.imported.cards,
        expenses: result.imported.expenses,
        installments: result.imported.installments,
        skipped:
          result.conflicts + Object.values(result.invalid).reduce((sum, count) => sum + count, 0),
      },
    });
  }
  return result;
}
