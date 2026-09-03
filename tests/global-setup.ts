import "dotenv/config";
import { execSync } from "node:child_process";

/**
 * Integration tests run against a dedicated database so they can never touch
 * development data. The schema is migrated and reference data seeded once.
 */
export default function globalSetup() {
  const url = process.env.TEST_DATABASE_URL ?? deriveTestUrl(process.env.DATABASE_URL);
  if (!url) {
    console.warn("[tests] No DATABASE_URL — integration tests will be skipped.");
    return;
  }

  process.env.DATABASE_URL = url;
  process.env.DIRECT_DATABASE_URL = url;

  try {
    execSync("npx prisma migrate deploy", {
      stdio: "pipe",
      env: { ...process.env, DATABASE_URL: url, DIRECT_DATABASE_URL: url },
    });
    execSync("npx tsx prisma/seed.ts", {
      stdio: "pipe",
      env: { ...process.env, DATABASE_URL: url, DIRECT_DATABASE_URL: url },
    });
  } catch (error) {
    console.warn("[tests] Could not prepare the test database:", (error as Error).message);
  }
}

function deriveTestUrl(base: string | undefined) {
  if (!base) return undefined;
  try {
    const url = new URL(base);
    url.pathname = "/dzgreen_test";
    return url.toString();
  } catch {
    return undefined;
  }
}
