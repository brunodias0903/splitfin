import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import postgres from "postgres";

const testPassword = "E2e-password-2026!";
let workerAccount: Promise<string> | undefined;

async function ensureWorkerAccount(page: Page) {
  if (workerAccount) return workerAccount;

  workerAccount = (async () => {
    const worker = test.info();
    const project = worker.project.name.replaceAll(/[^a-z0-9]/gi, "-").toLowerCase();
    const email = `e2e-${project}-${worker.parallelIndex}@splitfin.local`;
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL is required for authenticated E2E tests.");

    const sql = postgres(databaseUrl, { max: 1 });
    const [existingIdentity] = await sql`
      select 1
      from auth_identities identity
      join users on users.id = identity.user_id
      where users.email = ${email} and identity.provider_id = 'credential'
      limit 1
    `;

    if (!existingIdentity) {
      const signUpResponse = await page.request.post("/api/auth/sign-up/email", {
        data: { name: "Usuário E2E", email, password: testPassword },
      });

      if (!signUpResponse.ok()) {
        throw new Error(
          `E2E sign-up failed (${signUpResponse.status()}): ${await signUpResponse.text()}`,
        );
      }
    }

    await sql`update users set email_verified = true where email = ${email}`;
    await sql.end();
    return email;
  })();

  return workerAccount;
}

export async function openApp(page: Page) {
  await page.addInitScript(() => localStorage.clear());
  const email = await ensureWorkerAccount(page);

  const signInResponse = await page.request.post("/api/auth/sign-in/email", {
    data: { email, password: testPassword },
  });
  if (!signInResponse.ok()) {
    throw new Error(
      `E2E sign-in failed (${signInResponse.status()}): ${await signInResponse.text()}`,
    );
  }

  const sessionCookie = (await page.context().cookies()).find((cookie) =>
    cookie.name.endsWith("session_token"),
  );
  expect(sessionCookie).toMatchObject({ httpOnly: true, sameSite: "Lax" });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /bem-vindo|welcome back/i })).toBeVisible();
}

export async function navigateTo(page: Page, name: string) {
  const visibleNavigation = page.locator('nav[aria-label="Principal"]:visible');
  const link = visibleNavigation.getByRole("link", { name, exact: true });
  const href = await link.getAttribute("href");
  if (!href) throw new Error(`Navigation link '${name}' has no href.`);

  await link.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await page.waitForTimeout(200);
}

export async function expectNoA11yViolations(page: Page, testInfo: TestInfo) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  await testInfo.attach("accessibility-results", {
    body: JSON.stringify(results, null, 2),
    contentType: "application/json",
  });

  expect(results.violations).toEqual([]);
}

export { expect, test };
