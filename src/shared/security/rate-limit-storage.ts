import "server-only";

import { createHmac } from "node:crypto";
import { sql } from "drizzle-orm";

import type { Database } from "@/shared/db/client";
import { authRateLimits } from "@/shared/db/schema";

export function createPostgresRateLimitStorage(database: Database, secret: string) {
  return {
    async consume(key: string, rule: { window: number; max: number }) {
      const hashedKey = createHmac("sha256", secret).update(key).digest("hex");
      const now = Math.floor(Date.now() / 1000);
      const expiredBefore = now - rule.window;

      const [entry] = await database
        .insert(authRateLimits)
        .values({ key: hashedKey, count: 1, lastRequest: now })
        .onConflictDoUpdate({
          target: authRateLimits.key,
          set: {
            count: sql<number>`case
              when ${authRateLimits.lastRequest} <= ${expiredBefore} then 1
              else least(${authRateLimits.count} + 1, ${rule.max + 1})
            end`,
            lastRequest: sql<number>`case
              when ${authRateLimits.lastRequest} <= ${expiredBefore} then ${now}
              else ${authRateLimits.lastRequest}
            end`,
          },
        })
        .returning();

      const allowed = entry.count <= rule.max;
      return {
        allowed,
        retryAfter: allowed ? null : Math.max(1, entry.lastRequest + rule.window - now),
      };
    },
  };
}
