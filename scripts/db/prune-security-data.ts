import { lt } from "drizzle-orm";

import { closeDatabase, getDatabase } from "../../src/shared/db/client";
import { authRateLimits, securityAuditEvents } from "../../src/shared/db/schema";

function readPositiveInteger(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value <= 0)
    throw new Error(`${name} must be a positive integer.`);
  return value;
}

const auditRetentionDays = readPositiveInteger("SECURITY_AUDIT_RETENTION_DAYS", 90);
const rateLimitRetentionHours = readPositiveInteger("RATE_LIMIT_RETENTION_HOURS", 24);
const now = Date.now();
const auditCutoff = new Date(now - auditRetentionDays * 24 * 60 * 60 * 1000);
const rateLimitCutoff = Math.floor((now - rateLimitRetentionHours * 60 * 60 * 1000) / 1000);
const database = getDatabase();

try {
  const removedAuditEvents = await database
    .delete(securityAuditEvents)
    .where(lt(securityAuditEvents.createdAt, auditCutoff))
    .returning({ id: securityAuditEvents.id });
  const removedRateLimits = await database
    .delete(authRateLimits)
    .where(lt(authRateLimits.lastRequest, rateLimitCutoff))
    .returning({ key: authRateLimits.key });

  console.info(
    `Security retention applied: ${removedAuditEvents.length} audit events and ${removedRateLimits.length} rate-limit entries removed.`,
  );
} finally {
  await closeDatabase();
}
