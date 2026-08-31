import { createRequire } from "node:module";
import { defineConfig, devices } from "@playwright/test";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env") as typeof import("@next/env");
const port = 4173;
const baseURL = `http://127.0.0.1:${port}`;

loadEnvConfig(process.cwd(), true);
process.env.BETTER_AUTH_URL = baseURL;
process.env.BETTER_AUTH_RATE_LIMIT_DISABLED = "true";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["html", { open: "never" }], ["github"]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], locale: "pt-BR" },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"], locale: "pt-BR" },
    },
  ],
  webServer: {
    command: `pnpm build && pnpm start --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
