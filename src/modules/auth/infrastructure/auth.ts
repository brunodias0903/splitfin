import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { sendAuthEmail } from "./auth-email";
import { getDatabase } from "@/shared/db/client";
import { authIdentities, authSessions, authVerifications, users } from "@/shared/db/schema";

const appUrl = process.env.BETTER_AUTH_URL;
const authSecret = process.env.BETTER_AUTH_SECRET;

if (!appUrl) throw new Error("BETTER_AUTH_URL is required.");
if (!authSecret || authSecret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters.");
}

export const auth = betterAuth({
  appName: "Splitfin",
  baseURL: appUrl,
  secret: authSecret,
  database: drizzleAdapter(getDatabase(), {
    provider: "pg",
    schema: {
      user: users,
      account: authIdentities,
      session: authSessions,
      verification: authVerifications,
    },
  }),
  advanced: {
    cookiePrefix: "splitfin",
    database: {
      generateId: "uuid",
    },
  },
  trustedOrigins: [appUrl],
  rateLimit: {
    enabled: process.env.BETTER_AUTH_RATE_LIMIT_DISABLED !== "true",
  },
  user: {
    modelName: "user",
  },
  account: {
    modelName: "account",
    accountLinking: {
      disableImplicitLinking: true,
      allowDifferentEmails: false,
      allowUnlinkingAll: false,
    },
  },
  session: {
    modelName: "session",
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  verification: {
    modelName: "verification",
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      void sendAuthEmail({
        to: user.email,
        subject: "Confirme seu e-mail no Splitfin",
        text: `Confirme seu e-mail acessando: ${url}`,
        html: `<p>Confirme seu e-mail para acessar o Splitfin.</p><p><a href="${url}">Confirmar e-mail</a></p>`,
      }).catch(() => console.error("Failed to send an authentication email."));
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      void sendAuthEmail({
        to: user.email,
        subject: "Redefina sua senha do Splitfin",
        text: `Redefina sua senha acessando: ${url}`,
        html: `<p>Recebemos uma solicitação para redefinir sua senha.</p><p><a href="${url}">Redefinir senha</a></p>`,
      }).catch(() => console.error("Failed to send an authentication email."));
    },
  },
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
