import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;

// A dedicated database so end-to-end runs never touch development data.
const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  (process.env.DATABASE_URL
    ? (() => {
        const url = new URL(process.env.DATABASE_URL!);
        url.pathname = "/dzgreen_e2e";
        return url.toString();
      })()
    : "");

export default defineConfig({
  testDir: "./e2e",
  // The production smoke suite runs against a live deployment; it has its own
  // config and asserts on an empty database, which the local run does not have.
  testIgnore: /production-smoke\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : [["list"]],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  globalSetup: "./e2e/global-setup.ts",

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "fr-DZ",
  },

  projects: [
    {
      // The full authoring-to-verification journey runs once, on desktop.
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /critical-flow\.spec\.ts/,
    },
    {
      // Handheld run covers the mobile-specific surface: tab bar, layout and PWA.
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
      testMatch: /responsive\.spec\.ts/,
    },
  ],

  webServer: {
    command: `npx next start --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      DIRECT_DATABASE_URL: E2E_DATABASE_URL,
      NEXT_PUBLIC_APP_URL: BASE_URL,
      AUTH_SECRET: process.env.AUTH_SECRET ?? "e2e-secret-not-used-in-production",
      NODE_ENV: "production",
    },
  },
});
