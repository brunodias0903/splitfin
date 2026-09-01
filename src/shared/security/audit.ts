import "server-only";

import type { Database } from "@/shared/db/client";
import { securityAuditEvents } from "@/shared/db/schema";

export type AuditAction =
  | "auth.identity.created"
  | "auth.identity.updated"
  | "auth.password_reset.requested"
  | "auth.session.created"
  | "auth.session.revoked"
  | `finance.${"account" | "card" | "category" | "expense" | "installment"}.${
      "created" | "updated" | "deleted" | "archived"}`
  | "finance.installment.paid";

interface AuditEvent {
  actorUserId?: string | null;
  action: AuditAction;
  outcome?: "success" | "denied" | "failure";
  entityType?: string;
  entityId?: string;
  requestId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export async function recordAuditEvent(database: Database, event: AuditEvent) {
  await database.insert(securityAuditEvents).values(event);
}

export async function recordAuditEventSafely(database: Database, event: AuditEvent) {
  try {
    await recordAuditEvent(database, event);
  } catch {
    console.error("Failed to persist a security audit event.");
  }
}
