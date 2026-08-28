import { expect, navigateTo, openApp, test } from "./fixtures";

test.describe("experiência principal", () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
  });

  test("carrega a fonte e os tokens do design system", async ({ page }) => {
    await page.evaluate(() => document.fonts.ready);

    const styles = await page.locator("body").evaluate((element) => {
      const bodyStyle = getComputedStyle(element);
      const rootStyle = getComputedStyle(document.documentElement);
      return {
        fontFamily: bodyStyle.fontFamily,
        primary: rootStyle.getPropertyValue("--primary").trim(),
        spacing: rootStyle.getPropertyValue("--space-6").trim(),
        radius: rootStyle.getPropertyValue("--radius-comfortable").trim(),
      };
    });

    expect(styles.fontFamily).toContain("Poppins");
    expect(styles.primary).toBe("#4f46e5");
    expect(styles.spacing).toBe("1.5rem");
    expect(styles.radius).toBe("1rem");
  });

  test("registra e exibe uma despesa", async ({ page }) => {
    await navigateTo(page, "Despesas");
    await page.getByLabel("Descrição", { exact: true }).fill("Supermercado");
    await page.getByLabel("Valor", { exact: true }).fill("184.90");
    await page.getByRole("button", { name: "Adicionar Despesa", exact: true }).click();

    await expect(page.getByText("Supermercado", { exact: true })).toBeVisible();
    await expect(page.getByRole("listitem").getByText("R$ 184,90", { exact: true })).toBeVisible();
    await expect(page.getByText(/1 lançamento/)).toBeVisible();
  });

  test("cadastra e exibe um cartão", async ({ page }) => {
    await navigateTo(page, "Cartões");
    await page.getByRole("button", { name: "Adicionar Cartão", exact: true }).click();
    await page.getByLabel("Nome do Cartão", { exact: true }).fill("Cartão principal");
    await page.getByLabel("Últimos 4 dígitos", { exact: true }).fill("4242");
    await page.getByRole("button", { name: "Adicionar Cartão", exact: true }).click();

    await expect(page.getByText("Cartão principal", { exact: true })).toBeVisible();
    await expect(page.getByText("•••• 4242", { exact: true })).toBeVisible();
  });

  test("cadastra uma parcela e mostra o progresso", async ({ page }) => {
    await navigateTo(page, "Parcelas");
    await page.getByLabel("Descrição", { exact: true }).fill("Notebook");
    await page.getByLabel("Valor da Parcela", { exact: true }).fill("499.90");
    await page.getByLabel("Quant. Parcelas", { exact: true }).fill("6");
    await page.getByLabel("Pagas", { exact: true }).fill("2");
    await page.getByRole("button", { name: "Adicionar Parcela", exact: true }).click();

    await expect(page.getByText("Notebook", { exact: true })).toBeVisible();
    await expect(page.getByText("33%", { exact: true })).toBeVisible();
    await expect(page.getByText("2 de 6 pagas", { exact: true })).toBeVisible();
  });

  test("mantém navegação visível e não cria rolagem horizontal", async ({ page }) => {
    const navigation = page.locator('nav[aria-label="Principal"]:visible');
    await expect(navigation).toBeVisible();
    await expect(navigation.getByRole("button")).toHaveCount(4);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("expõe foco visível para navegação por teclado", async ({ page }) => {
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();

    const outlineStyle = await focused.evaluate(
      (element) => getComputedStyle(element).outlineStyle,
    );
    expect(outlineStyle).not.toBe("none");
  });
});
