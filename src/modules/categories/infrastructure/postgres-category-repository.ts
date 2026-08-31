import { and, desc, eq, isNull, or } from "drizzle-orm";

import { categories } from "@/shared/db/schema";
import { resolveCurrentUserId, type ScopedRepositoryDependencies } from "@/shared/db/user-scope";

type CategoryValues = Omit<
  typeof categories.$inferInsert,
  "id" | "userId" | "createdAt" | "updatedAt"
>;
type CategoryPatch = Partial<CategoryValues>;

export function createPostgresCategoryRepository({
  database,
  resolveUserId = resolveCurrentUserId,
}: ScopedRepositoryDependencies) {
  return {
    async list() {
      const userId = await resolveUserId();
      return database
        .select()
        .from(categories)
        .where(or(eq(categories.userId, userId), isNull(categories.userId)))
        .orderBy(desc(categories.createdAt));
    },

    async findById(id: string) {
      const userId = await resolveUserId();
      const [category] = await database
        .select()
        .from(categories)
        .where(
          and(eq(categories.id, id), or(eq(categories.userId, userId), isNull(categories.userId))),
        )
        .limit(1);
      return category ?? null;
    },

    async create(values: CategoryValues) {
      const userId = await resolveUserId();
      const [category] = await database
        .insert(categories)
        .values({ ...values, userId })
        .returning();
      return category;
    },

    async update(id: string, values: CategoryPatch) {
      const userId = await resolveUserId();
      const [category] = await database
        .update(categories)
        .set({ ...values, userId, updatedAt: new Date() })
        .where(and(eq(categories.id, id), eq(categories.userId, userId)))
        .returning();
      return category ?? null;
    },

    async remove(id: string) {
      const userId = await resolveUserId();
      const [category] = await database
        .delete(categories)
        .where(and(eq(categories.id, id), eq(categories.userId, userId)))
        .returning({ id: categories.id });
      return Boolean(category);
    },
  };
}
