import type { Database } from "./client";

export type UserIdResolver = () => Promise<string>;

export async function resolveCurrentUserId() {
  const { requireCurrentUserId } = await import("@/modules/auth/infrastructure/session");
  return requireCurrentUserId();
}

export class InvalidOwnedReferenceError extends Error {
  constructor(resource: string) {
    super(`The referenced ${resource} does not belong to the authenticated user.`);
    this.name = "InvalidOwnedReferenceError";
  }
}

export type ScopedRepositoryDependencies = {
  database: Database;
  resolveUserId?: UserIdResolver;
};
