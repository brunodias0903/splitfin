import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/modules/auth/infrastructure/auth";
import { getDatabase } from "@/shared/db/client";
import { recordAuditEventSafely, type AuditAction } from "@/shared/security/audit";

const handlers = toNextJsHandler(auth);
const database = getDatabase();

function secureResponse(response: Response) {
  const secured = new Response(response.body, response);
  secured.headers.set("Cache-Control", "no-store");
  secured.headers.set("Pragma", "no-cache");
  return secured;
}

export async function GET(request: Request) {
  return secureResponse(await handlers.GET(request));
}

export async function POST(request: Request) {
  const response = await handlers.POST(request);
  const path = new URL(request.url).pathname;
  const failedAction: AuditAction | undefined = path.endsWith("/sign-in/email")
    ? "auth.session.created"
    : path.endsWith("/sign-up/email")
      ? "auth.identity.created"
      : path.endsWith("/sign-out")
        ? "auth.session.revoked"
        : undefined;

  if (failedAction && response.status >= 400) {
    await recordAuditEventSafely(database, { action: failedAction, outcome: "failure" });
  }

  if (path.endsWith("/request-password-reset")) {
    await recordAuditEventSafely(database, {
      action: "auth.password_reset.requested",
      outcome: response.status < 400 ? "success" : "failure",
    });
  }

  if (
    response.status !== 429 &&
    (path.endsWith("/sign-up/email") || path.endsWith("/request-password-reset"))
  ) {
    return secureResponse(
      Response.json(
        { accepted: true, message: "Se os dados forem elegíveis, as instruções serão enviadas." },
        { status: 202 },
      ),
    );
  }

  if (response.status !== 429 && response.status >= 400 && path.endsWith("/sign-in/email")) {
    return secureResponse(
      Response.json(
        { code: "AUTHENTICATION_FAILED", message: "Não foi possível autenticar." },
        { status: 401 },
      ),
    );
  }

  return secureResponse(response);
}
