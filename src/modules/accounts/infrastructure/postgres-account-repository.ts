import { and, desc, eq } from "drizzle-orm";

import { accounts } from "@/shared/db/schema";
import { resolveCurrentUserId, type ScopedRepositoryDependencies } from "@/shared/db/user-scope";

type AccountValues = Omit<
  typeof accounts.$inferInsert,
  "id" | "userId" | "createdAt" | "updatedAt"
>;
type AccountPatch = Partial<AccountValues>;

export function createPostgresAccountRepository({
  database,
  resolveUserId = resolveCurrentUserId,
}: ScopedRepositoryDependencies) {
  return {
    async list() {
      const userId = await resolveUserId();
      return database
        .select()
        .from(accounts)
        .where(eq(accounts.userId, userId))
        .orderBy(desc(accounts.createdAt));
    },

    async findById(id: string) {
      const userId = await resolveUserId();
      const [account] = await database
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
        .limit(1);
      return account ?? null;
    },

    async create(values: AccountValues) {
      const userId = await resolveUserId();
      const [account] = await database
        .insert(accounts)
        .values({ ...values, userId })
        .returning();
      return account;
    },

    async update(id: string, values: AccountPatch) {
      const userId = await resolveUserId();
      const [account] = await database
        .update(accounts)
        .set({ ...values, userId, updatedAt: new Date() })
        .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
        .returning();
      return account ?? null;
    },

    async remove(id: string) {
      const userId = await resolveUserId();
      const [account] = await database
        .delete(accounts)
        .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
        .returning({ id: accounts.id });
      return Boolean(account);
    },
  };
}
