import "server-only";
import type { NotificationType, Prisma, PrismaClient } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";

type Client = PrismaClient | Prisma.TransactionClient;

/**
 * Notifications store a type plus structured data; the human-readable text is
 * rendered from the translation catalogue at display time, so a user always
 * reads them in their own language.
 */
export async function notify(
  client: Client,
  input: { userId: string; type: NotificationType; data?: Prisma.InputJsonValue },
) {
  await client.notification.create({
    data: { userId: input.userId, type: input.type, data: input.data ?? {} },
  });
}

export async function notifyMany(
  client: Client,
  userIds: string[],
  type: NotificationType,
  data?: Prisma.InputJsonValue,
) {
  if (userIds.length === 0) return;
  await client.notification.createMany({
    data: userIds.map((userId) => ({ userId, type, data: data ?? {} })),
  });
}

export async function listNotifications(userId: string, take = 30) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function countUnread(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
