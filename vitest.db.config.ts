import nextEnv from "@next/env";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL is required for database integration tests.");
}

const databaseName = new URL(testDatabaseUrl).pathname.slice(1);

if (!databaseName.endsWith("_test")) {
  throw new Error(
    `Refusing to run database tests against '${databaseName}'. Use a *_test database.`,
  );
}

process.env.DATABASE_URL = testDatabaseUrl;

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    fileParallelism: false,
  },
});
