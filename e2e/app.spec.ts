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
    await navigateTo(page, "Cartões");
    await page.getByRole("button", { name: "Adicionar Cartão", exact: true }).click();
    await page.getByLabel("Nome do Cartão", { exact: true }).fill("Cartão da despesa");
    await page.getByLabel("Últimos 4 dígitos", { exact: true }).fill("9876");
    await page.getByRole("button", { name: "Adicionar Cartão", exact: true }).click();
    await expect(page.getByText("Cartão da despesa", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Nome do Cartão", { exact: true })).not.toBeVisible();

    await navigateTo(page, "Despesas");
    await page.getByLabel("Descrição", { exact: true }).fill("Supermercado");
    await page.getByLabel("Valor", { exact: true }).fill("184.90");
    await page.getByLabel("Pagamento", { exact: true }).selectOption("credit");
    await page
      .getByLabel("Cartões", { exact: true })
      .selectOption({ label: "Cartão da despesa ••9876" });
    await page.getByRole("button", { name: "Adicionar Despesa", exact: true }).click();

    await expect(page.getByText("Supermercado", { exact: true })).toBeVisible();
    await expect(page.getByRole("listitem").getByText("R$ 184,90", { exact: true })).toBeVisible();
    await expect(page.getByRole("listitem").getByText(/Cartão da despesa/)).toBeVisible();
    await expect(page.getByText(/1 lançamento/)).toBeVisible();

    const secondContext = await browser.newContext({ locale: "pt-BR" });
    const secondPage = await secondContext.newPage();
    await signInExistingAccount(secondPage);
    await secondPage.goto("/expenses");
    const persistedExpense = secondPage.getByRole("listitem").filter({ hasText: "Supermercado" });
    await expect(persistedExpense).toHaveCount(1);
    await expect(persistedExpense.getByText("Supermercado", { exact: true })).toBeVisible();
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

  test("persiste e exibe um cartão em outro navegador", async ({ page, browser }) => {
    await navigateTo(page, "Cartões");
    await page.getByRole("button", { name: "Adicionar Cartão", exact: true }).click();
    await page.getByLabel("Nome do Cartão", { exact: true }).fill("Cartão principal");
    await page.getByLabel("Últimos 4 dígitos", { exact: true }).fill("4242");
    await page.getByLabel("Dia de fechamento", { exact: true }).fill("7");
    await page.getByLabel("Dia de vencimento", { exact: true }).fill("14");
    await page.getByRole("button", { name: "Adicionar Cartão", exact: true }).click();

    await expect(page.getByText("Cartão principal", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Nome do Cartão", { exact: true })).not.toBeVisible();
    await expect(page.getByText("•••• 4242", { exact: true })).toBeVisible();
    await expect(page.getByText("Fecha dia 7 · Vence dia 14", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Editar", exact: true }).click();
    await page.getByLabel("Dia de vencimento", { exact: true }).fill("15");
    await page.getByRole("button", { name: "Atualizar", exact: true }).click();
    await expect(page.getByText("Fecha dia 7 · Vence dia 15", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Nome do Cartão", { exact: true })).not.toBeVisible();

    const secondContext = await browser.newContext({ locale: "pt-BR" });
    const secondPage = await secondContext.newPage();
    await signInExistingAccount(secondPage);
    await secondPage.goto("/cards");
    await expect(secondPage.getByText("Cartão principal", { exact: true })).toBeVisible();
    await expect(secondPage.getByText("Fecha dia 7 · Vence dia 15", { exact: true })).toBeVisible();
    await secondContext.close();
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
    await page.getByRole("button", { name: "Pagar Parcela", exact: true }).click();
    await expect(page.getByText("3 de 6 pagas", { exact: true })).toBeVisible();
    await navigateTo(page, "Despesas");
    await expect(page.getByText("Notebook (3/6)", { exact: true })).toBeVisible();
  });

  test("importa, repete com segurança e remove dados locais somente após confirmação", async ({
    page,
  }) => {
    await page.evaluate(() => {
      localStorage.setItem(
        "cards",
        JSON.stringify([
          {
            id: "legacy-card-e2e",
            name: "Cartão legado",
            last4: "1122",
            type: "credit",
            closingDay: 8,
            dueDay: 16,
          },
        ]),
      );
      localStorage.setItem(
        "expenses",
        JSON.stringify([
          {
            id: "legacy-expense-e2e",
            description: "Despesa legada",
            amount: 75.5,
            category: "Food",
            paymentType: "credit",
            cardId: "legacy-card-e2e",
            date: "2026-09-01",
          },
          { id: "legacy-invalid-e2e", description: "X" },
        ]),
      );
      localStorage.setItem(
        "fixedExpenses",
        JSON.stringify([
          {
            id: "legacy-plan-e2e",
            description: "Parcela legada",
            totalAmount: 300,
            totalInstallments: 3,
            paidInstallments: 1,
            category: "Shopping",
            startDate: "2026-09-01",
            active: true,
            cardId: "legacy-card-e2e",
          },
        ]),
      );
    });

    await navigateTo(page, "Importar");
    await expect(page.getByText("1 válidos")).toHaveCount(3);
    await expect(page.getByText("1 inválidos")).toBeVisible();
    await expect(page.getByText(/SHA-256/)).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Baixar backup" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^splitfin-local-backup-/);

    await page.route("**/import", async (route) => {
      if (route.request().method() === "POST") await route.abort();
      else await route.continue();
    });
    await page.getByRole("button", { name: "Importar dados válidos" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: /conteúdo local foi preservado/i }),
    ).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("expenses"))).not.toBeNull();
    await page.unroute("**/import");

    await page.getByRole("button", { name: "Importar dados válidos" }).click();
    await expect(page.getByRole("heading", { name: "Importação concluída" })).toBeVisible();

    await navigateTo(page, "Cartões");
    await expect(page.getByText("Cartão legado", { exact: true })).toBeVisible();
    await navigateTo(page, "Despesas");
    await expect(page.getByText("Despesa legada", { exact: true })).toBeVisible();
    await navigateTo(page, "Parcelas");
    await expect(page.getByText("Parcela legada", { exact: true })).toBeVisible();

    await navigateTo(page, "Importar");
    await page.getByRole("button", { name: "Importar dados válidos" }).click();
    await expect(page.getByText(/nenhum registro foi duplicado/i)).toBeVisible();
    const clearButton = page.getByRole("button", { name: "Remover dados locais" });
    await expect(clearButton).toBeDisabled();
    await page.getByLabel(/Confirmo que baixei o backup/).check();
    await clearButton.click();
    await expect(page.getByText("Os dados legados foram removidos deste navegador.")).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() =>
          ["cards", "expenses", "fixedExpenses"].every((key) => localStorage.getItem(key) === null),
        ),
      )
      .toBe(true);
  });

  test("mantém navegação visível e não cria rolagem horizontal", async ({ page }) => {
    const navigation = page.locator('nav[aria-label="Principal"]:visible');
    await expect(navigation).toBeVisible();
    await expect(navigation.getByRole("link")).toHaveCount(5);

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
