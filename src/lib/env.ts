/**
 * Environment access. Values are read lazily so that `next build` never
 * crashes on a machine where runtime secrets are not present.
 */
function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

function required(name: string): string {
  const value = optional(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get authSecret() {
    return required("AUTH_SECRET");
  },
  get appUrl() {
    return (
      optional("NEXT_PUBLIC_APP_URL") ??
      (optional("VERCEL_PROJECT_PRODUCTION_URL")
        ? `https://${optional("VERCEL_PROJECT_PRODUCTION_URL")}`
        : undefined) ??
      (optional("VERCEL_URL") ? `https://${optional("VERCEL_URL")}` : undefined) ??
      "http://localhost:3000"
    );
  },
  get blobToken() {
    return optional("BLOB_READ_WRITE_TOKEN");
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
  get adminBootstrapEmail() {
    return optional("ADMIN_BOOTSTRAP_EMAIL");
  },
  get adminBootstrapPassword() {
    return optional("ADMIN_BOOTSTRAP_PASSWORD");
  },
  get adminBootstrapName() {
    return optional("ADMIN_BOOTSTRAP_NAME");
  },
};

export const APP_NAME = "Algeria Green";
