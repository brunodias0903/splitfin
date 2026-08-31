import "server-only";

import { headers } from "next/headers";

import { auth } from "@/modules/auth/infrastructure/auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireCurrentUserId() {
  const session = await getSession();
  if (!session) throw new Error("Authentication is required.");
  return session.user.id;
}
