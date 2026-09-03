import { defineConfig, devices } from "@playwright/test";

/**
 * Read-only verification of a live deployment. It never signs up, signs in or
 * writes anything — production must not accumulate test content.
 *
 *   PRODUCTION_URL=https://… npx playwright test -c playwright.production.config.ts
 */
const BASE_URL = process.env.PRODUCTION_URL ?? "https://algeria-green-nine.vercel.app";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /production-smoke\.spec\.ts/,
  fullyParallel: true,
  workers: 2,
  retries: 1,
  reporter: [["list"]],
  timeout: 60_000,
  expect: { timeout: 20_000 },
  use: { baseURL: BASE_URL, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
