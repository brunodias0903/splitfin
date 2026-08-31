import { expectNoA11yViolations, expect, openApp, test } from "./fixtures";

test.describe("autenticação", () => {
  test("redireciona visitante anônimo para o login", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Entre na sua conta" })).toBeVisible();
  });

  test("expõe cadastro e recuperação de senha", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Crie sua conta" })).toBeVisible();
    await expect(page.getByLabel("Senha", { exact: true })).toHaveAttribute("minlength", "12");

    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: "Recupere sua senha" })).toBeVisible();
  });

  test("encerra a sessão e retorna ao login", async ({ page }) => {
    await openApp(page);
    await page.getByRole("button", { name: "Sair" }).filter({ visible: true }).click();

    await expect(page).toHaveURL(/\/login$/);
    expect(
      (await page.context().cookies()).some((cookie) => cookie.name.endsWith("session_token")),
    ).toBe(false);
  });

  for (const [name, path] of [
    ["login", "/login"],
    ["cadastro", "/register"],
    ["recuperação", "/forgot-password"],
  ] as const) {
    test(`${name} não possui violações automáticas de acessibilidade`, async ({
      page,
    }, testInfo) => {
      await page.goto(path);
      await expectNoA11yViolations(page, testInfo);
    });
  }
});
