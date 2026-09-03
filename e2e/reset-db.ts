import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";

const connectionString = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
if (!/dzgreen_e2e/.test(connectionString)) {
  throw new Error("Refusing to reset a database that is not the end-to-end one.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  await prisma.$transaction([
    prisma.treeVerification.deleteMany(),
    prisma.tree.deleteMany(),
    prisma.campaignParticipant.deleteMany(),
    prisma.campaign.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.session.deleteMany(),
    prisma.rateLimit.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  console.log("E2E database cleared.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
