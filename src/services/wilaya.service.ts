import "server-only";
import { prisma } from "@/lib/db/prisma";

export type WilayaStatsRow = {
  id: number;
  code: string;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  verifiedTrees: number;
  campaigns: number;
};

/** One pass over the aggregates — no per-wilaya queries. */
export async function listWilayaStats(): Promise<WilayaStatsRow[]> {
  const [wilayas, treeGroups, campaignGroups] = await Promise.all([
    prisma.wilaya.findMany({ orderBy: { id: "asc" } }),
    prisma.tree.groupBy({ by: ["wilayaId"], where: { status: "VERIFIED" }, _count: { _all: true } }),
    prisma.campaign.groupBy({
      by: ["wilayaId"],
      where: { status: { in: ["UPCOMING", "ACTIVE", "COMPLETED"] } },
      _count: { _all: true },
    }),
  ]);

  const trees = new Map(treeGroups.map((row) => [row.wilayaId, row._count._all]));
  const campaigns = new Map(campaignGroups.map((row) => [row.wilayaId, row._count._all]));

  return wilayas.map((wilaya) => ({
    id: wilaya.id,
    code: wilaya.code,
    nameAr: wilaya.nameAr,
    nameFr: wilaya.nameFr,
    nameEn: wilaya.nameEn,
    verifiedTrees: trees.get(wilaya.id) ?? 0,
    campaigns: campaigns.get(wilaya.id) ?? 0,
  }));
}

export async function getWilayaDetail(code: string) {
  const wilaya = await prisma.wilaya.findUnique({ where: { code } });
  if (!wilaya) return null;

  const [verifiedTrees, campaigns, participants, recentTrees, recentCampaigns] = await Promise.all([
    prisma.tree.count({ where: { wilayaId: wilaya.id, status: "VERIFIED" } }),
    prisma.campaign.count({
      where: { wilayaId: wilaya.id, status: { in: ["UPCOMING", "ACTIVE", "COMPLETED"] } },
    }),
    prisma.campaignParticipant.count({
      where: { campaign: { wilayaId: wilaya.id }, status: { in: ["REGISTERED", "ATTENDED"] } },
    }),
    prisma.tree.findMany({
      where: { wilayaId: wilaya.id, status: "VERIFIED" },
      orderBy: { reviewedAt: "desc" },
      take: 8,
      select: {
        publicId: true,
        plantingDate: true,
        commune: true,
        speciesOther: true,
        species: { select: { slug: true, nameAr: true, nameFr: true, nameEn: true } },
      },
    }),
    prisma.campaign.findMany({
      where: { wilayaId: wilaya.id, status: { in: ["UPCOMING", "ACTIVE", "COMPLETED"] } },
      orderBy: { date: "desc" },
      take: 6,
      select: { id: true, slug: true, title: true, date: true, status: true, commune: true, targetTrees: true },
    }),
  ]);

  return { wilaya, stats: { verifiedTrees, campaigns, participants }, recentTrees, recentCampaigns };
}
