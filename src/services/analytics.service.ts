import "server-only";
import { prisma } from "@/lib/db/prisma";

/**
 * Every figure exposed by these helpers is computed from the database.
 * Nothing is hardcoded, estimated or padded — an empty database yields zeros.
 * Only trees in the `VERIFIED` state contribute to public impact numbers.
 */

export type PublicStats = {
  verifiedTrees: number;
  campaigns: number;
  participants: number;
  wilayasCovered: number;
};

export async function getPublicStats(): Promise<PublicStats> {
  const [verifiedTrees, campaigns, participants, wilayaGroups] = await Promise.all([
    prisma.tree.count({ where: { status: "VERIFIED" } }),
    prisma.campaign.count({ where: { status: { in: ["UPCOMING", "ACTIVE", "COMPLETED"] } } }),
    prisma.campaignParticipant.count({ where: { status: { in: ["REGISTERED", "ATTENDED"] } } }),
    prisma.tree.groupBy({ by: ["wilayaId"], where: { status: "VERIFIED" }, _count: { _all: true } }),
  ]);
  return { verifiedTrees, campaigns, participants, wilayasCovered: wilayaGroups.length };
}

export type AdminStats = {
  totalUsers: number;
  totalCampaigns: number;
  totalTrees: number;
  pendingTrees: number;
  verifiedTrees: number;
  rejectedTrees: number;
  participants: number;
  wilayasCovered: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const [totalUsers, totalCampaigns, totalTrees, statusCounts, participants, wilayaGroups] =
    await Promise.all([
      prisma.user.count(),
      prisma.campaign.count(),
      prisma.tree.count(),
      prisma.tree.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.campaignParticipant.count(),
      prisma.tree.groupBy({ by: ["wilayaId"], where: { status: "VERIFIED" }, _count: { _all: true } }),
    ]);

  const byStatus = new Map(statusCounts.map((row) => [row.status, row._count._all]));
  return {
    totalUsers,
    totalCampaigns,
    totalTrees,
    pendingTrees: byStatus.get("PENDING") ?? 0,
    verifiedTrees: byStatus.get("VERIFIED") ?? 0,
    rejectedTrees: byStatus.get("REJECTED") ?? 0,
    participants,
    wilayasCovered: wilayaGroups.length,
  };
}

export type MonthlyPoint = { month: string; count: number; cumulative: number };

/** Verified trees grouped by planting month, oldest first. */
export async function getVerifiedTreesByMonth(months = 24): Promise<MonthlyPoint[]> {
  const rows = await prisma.$queryRaw<{ month: Date; count: bigint }[]>`
    SELECT date_trunc('month', "plantingDate") AS month, COUNT(*)::bigint AS count
    FROM "Tree"
    WHERE "status" = 'VERIFIED'
    GROUP BY 1
    ORDER BY 1 ASC
  `;
  const trimmed = rows.slice(-months);
  let running = 0;
  // The cumulative series must include everything before the visible window.
  const before = rows.slice(0, Math.max(0, rows.length - months));
  running = before.reduce((sum, row) => sum + Number(row.count), 0);

  return trimmed.map((row) => {
    const count = Number(row.count);
    running += count;
    const date = new Date(row.month);
    const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    return { month, count, cumulative: running };
  });
}

export type WilayaBreakdown = {
  wilayaId: number;
  verifiedTrees: number;
};

export async function getVerifiedTreesByWilaya(): Promise<WilayaBreakdown[]> {
  const rows = await prisma.tree.groupBy({
    by: ["wilayaId"],
    where: { status: "VERIFIED" },
    _count: { _all: true },
    orderBy: { _count: { wilayaId: "desc" } },
  });
  return rows.map((row) => ({ wilayaId: row.wilayaId, verifiedTrees: row._count._all }));
}

export type SourceSplit = { individual: number; campaign: number };

export async function getPlantingSourceSplit(): Promise<SourceSplit> {
  const [campaign, individual] = await Promise.all([
    prisma.tree.count({ where: { status: "VERIFIED", campaignId: { not: null } } }),
    prisma.tree.count({ where: { status: "VERIFIED", campaignId: null } }),
  ]);
  return { individual, campaign };
}

export type CampaignActivityPoint = { status: string; count: number };

export async function getCampaignActivity(): Promise<CampaignActivityPoint[]> {
  const rows = await prisma.campaign.groupBy({
    by: ["status"],
    where: { status: { not: "DRAFT" } },
    _count: { _all: true },
  });
  return rows.map((row) => ({ status: row.status, count: row._count._all }));
}
