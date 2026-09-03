import "server-only";
import type { Prisma, TreeStatus } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { generateTreePublicId } from "@/lib/security/tokens";
import { toPublicCoordinates, wilayaCentroid } from "@/lib/security/geo";
import type { TreeSubmissionInput } from "@/lib/validation/tree";
import { recordAudit } from "./audit.service";
import { notify } from "./notification.service";

const treeRowSelect = {
  id: true,
  publicId: true,
  plantingDate: true,
  commune: true,
  status: true,
  photoUrl: true,
  createdAt: true,
  reviewReason: true,
  speciesOther: true,
  species: { select: { id: true, slug: true, nameAr: true, nameFr: true, nameEn: true } },
  wilaya: { select: { id: true, code: true, nameAr: true, nameFr: true, nameEn: true } },
  campaign: { select: { id: true, slug: true, title: true } },
} satisfies Prisma.TreeSelect;

export type TreeRow = Prisma.TreeGetPayload<{ select: typeof treeRowSelect }>;

export type SubmitTreeResult =
  | { ok: true; publicId: string; id: string }
  | { ok: false; reason: "invalid_campaign" | "not_participant" | "invalid_species" };

export async function submitTree(
  input: TreeSubmissionInput,
  userId: string,
): Promise<SubmitTreeResult> {
  const species = await prisma.treeSpecies.findFirst({
    where: { id: input.speciesId, active: true },
    select: { id: true, slug: true },
  });
  if (!species) return { ok: false, reason: "invalid_species" };

  if (input.campaignId) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: input.campaignId },
      select: { id: true, status: true },
    });
    if (!campaign || campaign.status === "DRAFT" || campaign.status === "CANCELLED") {
      return { ok: false, reason: "invalid_campaign" };
    }
    // A tree may only be attached to a campaign the submitter actually joined.
    const participation = await prisma.campaignParticipant.findUnique({
      where: { campaignId_userId: { campaignId: input.campaignId, userId } },
      select: { status: true },
    });
    if (!participation || participation.status === "CANCELLED") {
      return { ok: false, reason: "not_participant" };
    }
  }

  const { publicLatitude, publicLongitude } = toPublicCoordinates(input.latitude, input.longitude);

  return prisma.$transaction(async (tx) => {
    let created: { id: string; publicId: string } | null = null;
    // publicId collisions are astronomically unlikely; retry anyway.
    for (let attempt = 0; attempt < 5 && !created; attempt += 1) {
      const publicId = generateTreePublicId();
      try {
        created = await tx.tree.create({
          data: {
            publicId,
            userId,
            campaignId: input.campaignId ?? null,
            speciesId: species.id,
            speciesOther: species.slug === "other" ? (input.speciesOther ?? null) : null,
            plantingDate: input.plantingDate,
            wilayaId: input.wilayaId,
            commune: input.commune,
            latitude: input.latitude ?? null,
            longitude: input.longitude ?? null,
            publicLatitude,
            publicLongitude,
            photoUrl: input.photoUrl ?? null,
            notes: input.notes ?? null,
            anonymous: input.anonymous,
            status: "PENDING",
          },
          select: { id: true, publicId: true },
        });
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (code !== "P2002") throw error;
      }
    }
    if (!created) throw new Error("Could not allocate a unique tree identifier");

    await notify(tx, {
      userId,
      type: "TREE_SUBMITTED",
      data: { tree: created.publicId, treeId: created.id },
    });
    return { ok: true, publicId: created.publicId, id: created.id } as const;
  });
}

export type ReviewResult =
  | { ok: true; status: TreeStatus }
  | { ok: false; reason: "not_found" | "already_reviewed" };

/**
 * Approval, rejection and correction requests all run inside one transaction:
 * the tree status, the verification record, the user notification and the
 * audit entry either all land or none do.
 */
export async function reviewTree(
  input: { treeId: string; action: "APPROVED" | "REJECTED" | "CORRECTION_REQUESTED"; reason: string | null },
  reviewerId: string,
  ip?: string | null,
): Promise<ReviewResult> {
  return prisma.$transaction(async (tx) => {
    const tree = await tx.tree.findUnique({
      where: { id: input.treeId },
      select: { id: true, publicId: true, userId: true, status: true, campaignId: true },
    });
    if (!tree) return { ok: false, reason: "not_found" } as const;
    if (tree.status !== "PENDING") return { ok: false, reason: "already_reviewed" } as const;

    const nextStatus: TreeStatus =
      input.action === "APPROVED" ? "VERIFIED" : input.action === "REJECTED" ? "REJECTED" : "PENDING";

    await tx.tree.update({
      where: { id: tree.id },
      data: {
        status: nextStatus,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        reviewReason: input.reason,
      },
    });

    await tx.treeVerification.create({
      data: { treeId: tree.id, reviewerId, action: input.action, reason: input.reason },
    });

    await notify(tx, {
      userId: tree.userId,
      type:
        input.action === "APPROVED"
          ? "TREE_APPROVED"
          : input.action === "REJECTED"
            ? "TREE_REJECTED"
            : "TREE_CORRECTION_REQUESTED",
      data: { tree: tree.publicId, treeId: tree.id, reason: input.reason ?? undefined },
    });

    await recordAudit(tx, {
      actorId: reviewerId,
      action:
        input.action === "APPROVED"
          ? "tree.approved"
          : input.action === "REJECTED"
            ? "tree.rejected"
            : "tree.correction_requested",
      entityType: "Tree",
      entityId: tree.id,
      metadata: { publicId: tree.publicId, campaignId: tree.campaignId, reason: input.reason },
      ip,
    });

    return { ok: true, status: nextStatus } as const;
  });
}

export async function listPendingTrees(page: number, perPage = 12) {
  const where: Prisma.TreeWhereInput = { status: "PENDING" };
  const [items, total] = await Promise.all([
    prisma.tree.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        species: true,
        wilaya: true,
        campaign: { select: { id: true, title: true, slug: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.tree.count({ where }),
  ]);
  return { items, total, page, perPage };
}

export async function listUserTrees(
  userId: string,
  filters: { status?: TreeStatus; campaignId?: string; page: number; perPage?: number },
) {
  const perPage = filters.perPage ?? 12;
  const where: Prisma.TreeWhereInput = {
    userId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.campaignId ? { campaignId: filters.campaignId } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.tree.findMany({
      where,
      select: treeRowSelect,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * perPage,
      take: perPage,
    }),
    prisma.tree.count({ where }),
  ]);
  return { items, total, page: filters.page, perPage };
}

export async function getUserTreeStats(userId: string) {
  const [total, groups, joined, attended] = await Promise.all([
    prisma.tree.count({ where: { userId } }),
    prisma.tree.groupBy({ by: ["status"], where: { userId }, _count: { _all: true } }),
    prisma.campaignParticipant.count({ where: { userId, status: { in: ["REGISTERED", "ATTENDED"] } } }),
    prisma.campaignParticipant.count({ where: { userId, status: "ATTENDED" } }),
  ]);
  const byStatus = new Map(groups.map((row) => [row.status, row._count._all]));
  return {
    total,
    verified: byStatus.get("VERIFIED") ?? 0,
    pending: byStatus.get("PENDING") ?? 0,
    rejected: byStatus.get("REJECTED") ?? 0,
    campaignsJoined: joined,
    campaignsAttended: attended,
  };
}

/** Public tree page: only verified trees, and never any private field. */
export async function getPublicTree(publicId: string) {
  const tree = await prisma.tree.findFirst({
    where: { publicId, status: "VERIFIED" },
    select: {
      publicId: true,
      plantingDate: true,
      commune: true,
      reviewedAt: true,
      photoUrl: true,
      publicLatitude: true,
      publicLongitude: true,
      anonymous: true,
      species: { select: { slug: true, nameAr: true, nameFr: true, nameEn: true, latin: true } },
      speciesOther: true,
      wilaya: { select: { id: true, code: true, nameAr: true, nameFr: true, nameEn: true } },
      campaign: { select: { slug: true, title: true } },
      user: { select: { id: true, name: true, publicProfile: true } },
    },
  });
  if (!tree) return null;

  const showPlanter = !tree.anonymous && tree.user.publicProfile;
  return {
    publicId: tree.publicId,
    plantingDate: tree.plantingDate,
    commune: tree.commune,
    verifiedAt: tree.reviewedAt,
    photoUrl: tree.photoUrl,
    latitude: tree.publicLatitude,
    longitude: tree.publicLongitude,
    species: tree.species,
    speciesOther: tree.speciesOther,
    wilaya: tree.wilaya,
    campaign: tree.campaign,
    planter: showPlanter ? { id: tree.user.id, name: tree.user.name } : null,
  };
}

export async function listRecentVerifiedTrees(take = 6) {
  const trees = await prisma.tree.findMany({
    where: { status: "VERIFIED" },
    orderBy: { reviewedAt: "desc" },
    take,
    select: {
      publicId: true,
      plantingDate: true,
      commune: true,
      photoUrl: true,
      anonymous: true,
      species: { select: { slug: true, nameAr: true, nameFr: true, nameEn: true } },
      speciesOther: true,
      wilaya: { select: { id: true, code: true, nameAr: true, nameFr: true, nameEn: true } },
      user: { select: { name: true, publicProfile: true } },
    },
  });
  return trees.map((tree) => ({
    publicId: tree.publicId,
    plantingDate: tree.plantingDate,
    commune: tree.commune,
    photoUrl: tree.photoUrl,
    species: tree.species,
    speciesOther: tree.speciesOther,
    wilaya: tree.wilaya,
    planterName: !tree.anonymous && tree.user.publicProfile ? tree.user.name : null,
  }));
}

export type MapTreePoint = {
  publicId: string;
  lat: number;
  lng: number;
  wilayaId: number;
  speciesSlug: string | null;
  approximate: boolean;
};

/**
 * Map data. Exact coordinates never leave the server: a point is either the
 * coarsened public coordinate or the wilaya centroid.
 */
export async function listMapTrees(filters: { wilayaId?: number; campaignId?: string; from?: string; to?: string }, limit = 2000): Promise<MapTreePoint[]> {
  const trees = await prisma.tree.findMany({
    where: {
      status: "VERIFIED",
      ...(filters.wilayaId ? { wilayaId: filters.wilayaId } : {}),
      ...(filters.campaignId ? { campaignId: filters.campaignId } : {}),
      ...(filters.from || filters.to
        ? {
            plantingDate: {
              ...(filters.from ? { gte: new Date(`${filters.from}T00:00:00.000Z`) } : {}),
              ...(filters.to ? { lte: new Date(`${filters.to}T00:00:00.000Z`) } : {}),
            },
          }
        : {}),
    },
    select: {
      publicId: true,
      wilayaId: true,
      publicLatitude: true,
      publicLongitude: true,
      species: { select: { slug: true } },
    },
    orderBy: { reviewedAt: "desc" },
    take: limit,
  });

  return trees.flatMap((tree) => {
    if (tree.publicLatitude != null && tree.publicLongitude != null) {
      return [{
        publicId: tree.publicId,
        lat: tree.publicLatitude,
        lng: tree.publicLongitude,
        wilayaId: tree.wilayaId,
        speciesSlug: tree.species?.slug ?? null,
        approximate: true,
      }];
    }
    const centroid = wilayaCentroid(tree.wilayaId);
    if (!centroid) return [];
    return [{
      publicId: tree.publicId,
      lat: centroid[0],
      lng: centroid[1],
      wilayaId: tree.wilayaId,
      speciesSlug: tree.species?.slug ?? null,
      approximate: true,
    }];
  });
}

export async function listMapCampaigns(filters: { wilayaId?: number }) {
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: { in: ["UPCOMING", "ACTIVE", "COMPLETED"] },
      ...(filters.wilayaId ? { wilayaId: filters.wilayaId } : {}),
    },
    select: {
      id: true, slug: true, title: true, status: true, date: true, commune: true,
      latitude: true, longitude: true, wilayaId: true,
    },
    take: 500,
  });

  return campaigns.flatMap((campaign) => {
    const position =
      campaign.latitude != null && campaign.longitude != null
        ? ([campaign.latitude, campaign.longitude] as [number, number])
        : wilayaCentroid(campaign.wilayaId);
    if (!position) return [];
    return [{
      id: campaign.id,
      slug: campaign.slug,
      title: campaign.title,
      status: campaign.status,
      date: campaign.date,
      commune: campaign.commune,
      lat: position[0],
      lng: position[1],
      wilayaId: campaign.wilayaId,
    }];
  });
}

export async function listSpecies() {
  return prisma.treeSpecies.findMany({ where: { active: true }, orderBy: { id: "asc" } });
}
