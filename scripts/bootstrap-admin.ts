/**
 * Creates (or promotes) the first administrator.
 *
 * This is a CLI-only path: the running application exposes no endpoint that
 * can grant ADMIN, so an attacker with web access alone can never reach it.
 * Credentials come from the environment, never from arguments, so they do not
 * land in shell history or process listings.
 *
 *   ADMIN_BOOTSTRAP_EMAIL=… ADMIN_BOOTSTRAP_PASSWORD=… npm run bootstrap:admin
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";
import { hashPassword, isStrongPassword } from "../src/lib/auth/password";

const connectionString = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const name = process.env.ADMIN_BOOTSTRAP_NAME?.trim() || "Administrator";

  if (!email || !password) {
    throw new Error(
      "Set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD before running this script.",
    );
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("ADMIN_BOOTSTRAP_EMAIL is not a valid address.");
  if (!isStrongPassword(password)) {
    throw new Error("ADMIN_BOOTSTRAP_PASSWORD must be at least 8 characters and contain a letter and a number.");
  }

  const passwordHash = await hashPassword(password);
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { role: "SUPER_ADMIN", status: "ACTIVE", passwordHash, emailVerified: new Date() },
        select: { id: true, email: true, role: true },
      })
    : await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: "SUPER_ADMIN",
          status: "ACTIVE",
          emailVerified: new Date(),
        },
        select: { id: true, email: true, role: true },
      });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "admin.bootstrapped",
      entityType: "User",
      entityId: user.id,
      metadata: { email: user.email, promoted: Boolean(existing) },
    },
  });

  console.log(`${existing ? "Promoted" : "Created"} ${user.email} as ${user.role}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
