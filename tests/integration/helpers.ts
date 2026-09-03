import { prisma } from "@/lib/db/prisma";

/** Wipes content tables between tests. Reference data (wilayas, species) stays. */
export async function resetContent() {
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
}

let counter = 0;
export function uniqueEmail(prefix = "user") {
  counter += 1;
  return `${prefix}.${Date.now()}.${counter}@example.dz`;
}
