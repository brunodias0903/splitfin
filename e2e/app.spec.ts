import { expect, navigateTo, openApp, signInExistingAccount, test } from "./fixtures";

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

  test("hidrata o dashboard sem divergências entre servidor e navegador", async ({ page }) => {
    const hydrationErrors: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error" && message.text().includes("Hydration failed")) {
        hydrationErrors.push(message.text());
      }
    });

    await page.reload();
    await expect(page.getByRole("heading", { name: /bem-vindo/i })).toBeVisible();

    expect(hydrationErrors).toEqual([]);
  });

  test("persiste, edita e exclui uma despesa em navegadores diferentes", async ({
    page,
    browser,
  }) => {
    await navigateTo(page, "Despesas");
    await page.getByLabel("Descrição", { exact: true }).fill("Supermercado");
    await page.getByLabel("Valor", { exact: true }).fill("184.90");
    await page.getByRole("button", { name: "Adicionar Despesa", exact: true }).click();

    await expect(page.getByText("Supermercado", { exact: true })).toBeVisible();
    await expect(page.getByRole("listitem").getByText("R$ 184,90", { exact: true })).toBeVisible();
    await expect(page.getByText(/1 lançamento/)).toBeVisible();

    const secondContext = await browser.newContext({ locale: "pt-BR" });
    const secondPage = await secondContext.newPage();
    await signInExistingAccount(secondPage);
    await secondPage.goto("/expenses");
    await expect(secondPage.getByText("Supermercado", { exact: true })).toBeVisible();
    await secondContext.close();

    await page.getByRole("listitem").getByRole("button", { name: "Editar" }).click();
    await page.getByLabel("Descrição", { exact: true }).fill("Mercado mensal");
    await page.getByRole("button", { name: "Atualizar", exact: true }).click();
    await expect(page.getByText("Mercado mensal", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Adicionar Despesa", exact: true }),
    ).toBeVisible();

    await page.reload();
    await expect(page.getByText("Mercado mensal", { exact: true })).toBeVisible();
    await page.getByRole("listitem").getByRole("button", { name: "Excluir" }).click();
    await expect(page.getByText("Mercado mensal", { exact: true })).not.toBeVisible();
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
    await expect(navigation.getByRole("link")).toHaveCount(4);

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
