import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPostgresRateLimitStorage } from "@/shared/security/rate-limit-storage";

import { closeDatabase, getDatabase } from "./client";
import { authRateLimits } from "./schema";

const database = getDatabase();
const secret = "integration-only-rate-limit-secret-value";

beforeAll(async () => {
  await migrate(database, { migrationsFolder: "drizzle" });
  await database.delete(authRateLimits);
});

afterAll(async () => {
  await database.delete(authRateLimits);
  await closeDatabase();
});

describe("PostgreSQL security controls", () => {
  it("enforces an atomic shared rate limit without storing the raw key", async () => {
    const storage = createPostgresRateLimitStorage(database, secret);
    const rawKey = "sign-in:203.0.113.42";

    await expect(storage.consume(rawKey, { window: 60, max: 2 })).resolves.toEqual({
      allowed: true,
      retryAfter: null,
    });
    await expect(storage.consume(rawKey, { window: 60, max: 2 })).resolves.toEqual({
      allowed: true,
      retryAfter: null,
    });
    const rejected = await storage.consume(rawKey, { window: 60, max: 2 });

    expect(rejected.allowed).toBe(false);
    expect(rejected.retryAfter).toBeGreaterThan(0);
    await expect(
      database.select().from(authRateLimits).where(eq(authRateLimits.key, rawKey)),
    ).resolves.toEqual([]);
  });

  it("does not allow concurrent requests to bypass the limit", async () => {
    const storage = createPostgresRateLimitStorage(database, secret);
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        storage.consume("concurrent-sign-in-key", { window: 60, max: 5 }),
      ),
    );

    expect(results.filter(({ allowed }) => allowed)).toHaveLength(5);
    expect(results.filter(({ allowed }) => !allowed)).toHaveLength(5);
  });
});
