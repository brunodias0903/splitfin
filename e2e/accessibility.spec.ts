import { expectNoA11yViolations, navigateTo, openApp, test } from "./fixtures";

test.describe("acessibilidade WCAG A e AA", () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
  });

  for (const screen of ["Dashboard", "Despesas", "Parcelas", "Cartões", "Importar"]) {
    test(`${screen} não possui violações automáticas`, async ({ page }, testInfo) => {
      if (screen !== "Dashboard") await navigateTo(page, screen);
      await expectNoA11yViolations(page, testInfo);
    });
  }

  test("formulários continuam acessíveis quando preenchidos", async ({ page }, testInfo) => {
    await navigateTo(page, "Despesas");
    await page.getByLabel("Descrição", { exact: true }).fill("Conta de energia");
    await page.getByLabel("Valor", { exact: true }).fill("210");
    await page.getByLabel("Pagamento", { exact: true }).selectOption("boleto");
    await page.getByLabel("Todas as Categorias", { exact: true }).first().selectOption("Bills");
    await expectNoA11yViolations(page, testInfo);
  });
});
