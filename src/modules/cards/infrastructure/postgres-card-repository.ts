import { and, desc, eq } from "drizzle-orm";

import { accounts, cards } from "@/shared/db/schema";
import {
  InvalidOwnedReferenceError,
  resolveCurrentUserId,
  type ScopedRepositoryDependencies,
} from "@/shared/db/user-scope";

type CardValues = Omit<typeof cards.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">;
type CardPatch = Partial<CardValues>;

export function createPostgresCardRepository({
  database,
  resolveUserId = resolveCurrentUserId,
}: ScopedRepositoryDependencies) {
  async function assertAccountOwnership(accountId: string | null | undefined, userId: string) {
    if (!accountId) return;
    const [account] = await database
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
      .limit(1);
    if (!account) throw new InvalidOwnedReferenceError("account");
  }

  return {
    async list() {
      const userId = await resolveUserId();
      return database
        .select()
        .from(cards)
        .where(eq(cards.userId, userId))
        .orderBy(desc(cards.createdAt));
    },

    async findById(id: string) {
      const userId = await resolveUserId();
      const [card] = await database
        .select()
        .from(cards)
        .where(and(eq(cards.id, id), eq(cards.userId, userId)))
        .limit(1);
      return card ?? null;
    },

    async create(values: CardValues) {
      const userId = await resolveUserId();
      await assertAccountOwnership(values.accountId, userId);
      const [card] = await database
        .insert(cards)
        .values({ ...values, userId })
        .returning();
      return card;
    },

    async update(id: string, values: CardPatch) {
      const userId = await resolveUserId();
      if ("accountId" in values) await assertAccountOwnership(values.accountId, userId);
      const [card] = await database
        .update(cards)
        .set({ ...values, userId, updatedAt: new Date() })
        .where(and(eq(cards.id, id), eq(cards.userId, userId)))
        .returning();
      return card ?? null;
    },

    async remove(id: string) {
      const userId = await resolveUserId();
      const [card] = await database
        .delete(cards)
        .where(and(eq(cards.id, id), eq(cards.userId, userId)))
        .returning({ id: cards.id });
      return Boolean(card);
    },
  };
}
