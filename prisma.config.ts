import "dotenv/config";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations must bypass any connection pooler (Neon/PgBouncer), so the
    // direct connection string wins when one is provided.
    url: env("DIRECT_DATABASE_URL") || env("DATABASE_URL"),
  },
});
