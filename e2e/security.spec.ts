import postgres from "postgres";

import { expect, openApp, test } from "./fixtures";

test.describe("controles de segurança", () => {
  test("envia headers de proteção nas páginas", async ({ page }) => {
    const response = await page.goto("/login");

    expect(response).not.toBeNull();
    expect(response!.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(response!.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response!.headers()["x-frame-options"]).toBe("DENY");
    expect(response!.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(response!.headers()["permissions-policy"]).toContain("camera=()");
    expect(response!.headers()["strict-transport-security"]).toContain("max-age=31536000");
    expect(response!.headers()["content-security-policy"]).not.toContain("unsafe-eval");
  });

  test("não revela o motivo de uma falha de login e impede cache", async ({ page }) => {
    const response = await page.request.post("/api/auth/sign-in/email", {
      data: { email: "unknown@splitfin.local", password: "invalid-password-value" },
    });

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({
      code: "AUTHENTICATION_FAILED",
      message: "Não foi possível autenticar.",
    });
    expect(response.headers()["cache-control"]).toBe("no-store");
    expect(response.headers().pragma).toBe("no-cache");

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL is required for security E2E tests.");
    const sql = postgres(databaseUrl, { max: 1 });
    const [event] = await sql`
      select actor_user_id, outcome, metadata
      from security_audit_events
      where action = 'auth.session.created' and outcome = 'failure'
      order by created_at desc
      limit 1
    `;
    await sql.end();

    expect(event).toMatchObject({ actor_user_id: null, outcome: "failure", metadata: null });
  });

  test("rejeita logout com origem não confiável e preserva a sessão", async ({ page }) => {
    await openApp(page);

    const response = await page.request.post("/api/auth/sign-out", {
      headers: { Origin: "https://attacker.example" },
      data: {},
    });

    expect(response.status()).toBe(403);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("registra a criação de sessão sem payload financeiro", async ({ page }) => {
    await openApp(page);
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL is required for security E2E tests.");

    const sql = postgres(databaseUrl, { max: 1 });
    const [event] = await sql`
      select action, metadata
      from security_audit_events
      where action = 'auth.session.created'
      order by created_at desc
      limit 1
    `;
    await sql.end();

    expect(event).toMatchObject({ action: "auth.session.created", metadata: null });
  });
});
