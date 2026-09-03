import "dotenv/config";
import { execSync } from "node:child_process";

export const ADMIN_EMAIL = "e2e.admin@algeria-green.test";
export const ADMIN_PASSWORD = "e2eAdmin2026";

/**
 * Prepares an isolated end-to-end database: schema, reference data and one
 * bootstrapped administrator. No demo content is inserted — the run creates
 * everything it needs through the real user interface.
 */
export default function globalSetup() {
  const url =
    process.env.E2E_DATABASE_URL ??
    (() => {
      const base = new URL(process.env.DATABASE_URL!);
      base.pathname = "/dzgreen_e2e";
      return base.toString();
    })();

  const env = { ...process.env, DATABASE_URL: url, DIRECT_DATABASE_URL: url };

  execSync("npx prisma migrate deploy", { stdio: "inherit", env });
  execSync("npx tsx e2e/reset-db.ts", { stdio: "inherit", env });
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env });
  execSync("npx tsx scripts/bootstrap-admin.ts", {
    stdio: "inherit",
    env: {
      ...env,
      ADMIN_BOOTSTRAP_EMAIL: ADMIN_EMAIL,
      ADMIN_BOOTSTRAP_PASSWORD: ADMIN_PASSWORD,
      ADMIN_BOOTSTRAP_NAME: "E2E Administrator",
    },
  });
}
