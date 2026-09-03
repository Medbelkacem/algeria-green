import "server-only";
import type { Prisma, Role, UserStatus } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { destroyAllSessionsFor } from "@/lib/auth/session";
import { recordAudit } from "./audit.service";
import { notify } from "./notification.service";

export async function listUsers(params: {
  q?: string;
  role?: Role;
  status?: UserStatus;
  page: number;
  perPage?: number;
}) {
  const perPage = params.perPage ?? 20;
  const where: Prisma.UserWhereInput = {
    ...(params.role ? { role: params.role } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.q
      ? {
          OR: [
            { name: { contains: params.q, mode: "insensitive" } },
            { email: { contains: params.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        emailVerified: true,
        wilaya: { select: { id: true, code: true, nameAr: true, nameFr: true, nameEn: true } },
        _count: { select: { trees: true, participation: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total, page: params.page, perPage };
}

export async function setUserStatus(
  targetUserId: string,
  status: UserStatus,
  actorId: string,
  ip?: string | null,
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: targetUserId },
      data: { status },
      select: { id: true, name: true, email: true, status: true },
    });
    await notify(tx, {
      userId: targetUserId,
      type: status === "SUSPENDED" ? "ACCOUNT_SUSPENDED" : "ACCOUNT_REACTIVATED",
    });
    await recordAudit(tx, {
      actorId,
      action: status === "SUSPENDED" ? "user.suspended" : "user.reactivated",
      entityType: "User",
      entityId: targetUserId,
      metadata: { email: user.email },
      ip,
    });
    return user;
  }).then(async (user) => {
    // A suspended account must lose access immediately, not at session expiry.
    if (status === "SUSPENDED") await destroyAllSessionsFor(targetUserId);
    return user;
  });
}

export async function setUserRole(targetUserId: string, role: Role, actorId: string, ip?: string | null) {
  const result = await prisma.$transaction(async (tx) => {
    const previous = await tx.user.findUnique({ where: { id: targetUserId }, select: { role: true } });
    const user = await tx.user.update({
      where: { id: targetUserId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    await notify(tx, { userId: targetUserId, type: "ROLE_CHANGED", data: { role } });
    await recordAudit(tx, {
      actorId,
      action: "user.role_changed",
      entityType: "User",
      entityId: targetUserId,
      metadata: { from: previous?.role ?? null, to: role, email: user.email },
      ip,
    });
    return user;
  });
  // Force a fresh session so the new role takes effect everywhere at once.
  await destroyAllSessionsFor(targetUserId);
  return result;
}

export async function getPublicProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      publicProfile: true,
      createdAt: true,
      wilaya: { select: { id: true, code: true, nameAr: true, nameFr: true, nameEn: true } },
    },
  });
  if (!user || !user.publicProfile) return null;

  const [treesTotal, verified, campaigns] = await Promise.all([
    prisma.tree.count({ where: { userId, status: { in: ["PENDING", "VERIFIED"] } } }),
    prisma.tree.count({ where: { userId, status: "VERIFIED" } }),
    prisma.campaignParticipant.count({ where: { userId, status: { in: ["REGISTERED", "ATTENDED"] } } }),
  ]);

  // Note the absence of email, phone and any authentication data.
  return {
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl,
    joinedAt: user.createdAt,
    wilaya: user.wilaya,
    stats: { treesTotal, verified, campaigns },
  };
}

export async function getUserForAdmin(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, role: true, status: true, createdAt: true, emailVerified: true,
      wilaya: { select: { id: true, code: true, nameAr: true, nameFr: true, nameEn: true } },
      _count: { select: { trees: true, participation: true } },
    },
  });
}
