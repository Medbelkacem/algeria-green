import "dotenv/config";

// `server-only` throws outside a React Server Component build; tests import the
// same modules the app does, so it is aliased away in vitest.config.ts.

// Point every module at the dedicated test database, never at development data.
if (!process.env.TEST_DATABASE_URL && process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    url.pathname = "/dzgreen_test";
    process.env.TEST_DATABASE_URL = url.toString();
  } catch {
    // Leave DATABASE_URL alone when it cannot be parsed.
  }
}
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.DIRECT_DATABASE_URL = process.env.TEST_DATABASE_URL;
}
