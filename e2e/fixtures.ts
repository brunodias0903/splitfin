import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type TestInfo } from "@playwright/test";

export async function openApp(page: Page) {
  await page.addInitScript(() => localStorage.clear());
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /bem-vindo|welcome back/i })).toBeVisible();
}

export async function navigateTo(page: Page, name: string) {
  const visibleNavigation = page.locator('nav[aria-label="Principal"]:visible');
  await visibleNavigation.getByRole("button", { name, exact: true }).click();
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
