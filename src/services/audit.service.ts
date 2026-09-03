import "server-only";
import type { Prisma, PrismaClient } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";

export type AuditAction =
  | "campaign.created"
  | "campaign.updated"
  | "campaign.status_changed"
  | "tree.approved"
  | "tree.rejected"
  | "tree.correction_requested"
  | "user.suspended"
  | "user.reactivated"
  | "user.role_changed"
  | "user.registered"
  | "admin.bootstrapped";

type Client = PrismaClient | Prisma.TransactionClient;

/**
 * Append-only from the application's point of view: nothing in this codebase
 * updates or deletes an `AuditLog` row.
 */
export async function recordAudit(
  client: Client,
  entry: {
    actorId: string | null;
    action: AuditAction;
    entityType: string;
    entityId?: string | null;
    metadata?: Prisma.InputJsonValue;
    ip?: string | null;
  },
) {
  await client.auditLog.create({
    data: {
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      metadata: entry.metadata ?? {},
      ip: entry.ip ?? null,
    },
  });
}

export async function listAuditLogs(params: { page: number; perPage: number }) {
  const skip = (params.page - 1) * params.perPage;
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: params.perPage,
      include: { actor: { select: { id: true, name: true, email: true } } },
    }),
    prisma.auditLog.count(),
  ]);
  return { items, total };
}
