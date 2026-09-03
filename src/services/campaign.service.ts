import "server-only";
import type { CampaignStatus, Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { progressPercent, slugify } from "@/lib/utils";
import { randomToken } from "@/lib/security/tokens";
import { recordAudit } from "./audit.service";
import { notify, notifyMany } from "./notification.service";
import type { CampaignInput } from "@/lib/validation/campaign";

export const PUBLIC_CAMPAIGN_STATUSES: CampaignStatus[] = ["UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"];

const campaignCardSelect = {
  id: true,
  slug: true,
  title: true,
  coverImageUrl: true,
  commune: true,
  date: true,
  startTime: true,
  endTime: true,
  status: true,
  targetTrees: true,
  organizerName: true,
  maxParticipants: true,
  wilaya: { select: { id: true, code: true, nameAr: true, nameFr: true, nameEn: true } },
  _count: { select: { participants: true } },
} satisfies Prisma.CampaignSelect;

export type CampaignCard = Prisma.CampaignGetPayload<{ select: typeof campaignCardSelect }> & {
  verifiedTrees: number;
  progress: number;
};

/** Verified-tree counts per campaign, in a single query (no N+1). */
async function verifiedTreeCounts(campaignIds: string[]): Promise<Map<string, number>> {
  if (campaignIds.length === 0) return new Map();
  const rows = await prisma.tree.groupBy({
    by: ["campaignId"],
    where: { status: "VERIFIED", campaignId: { in: campaignIds } },
    _count: { _all: true },
  });
  return new Map(rows.map((row) => [row.campaignId as string, row._count._all]));
}

function decorate<T extends { id: string; targetTrees: number }>(
  campaigns: T[],
  counts: Map<string, number>,
) {
  return campaigns.map((campaign) => {
    const verifiedTrees = counts.get(campaign.id) ?? 0;
    return { ...campaign, verifiedTrees, progress: progressPercent(verifiedTrees, campaign.targetTrees) };
  });
}

export type CampaignListFilters = {
  q?: string;
  wilayaId?: number;
  status?: CampaignStatus;
  from?: string;
  to?: string;
  sort: "dateAsc" | "dateDesc" | "newest" | "progress";
  page: number;
  perPage?: number;
};

export async function listPublicCampaigns(filters: CampaignListFilters) {
  const perPage = filters.perPage ?? 12;
  const where: Prisma.CampaignWhereInput = {
    status: filters.status ? filters.status : { in: PUBLIC_CAMPAIGN_STATUSES },
    ...(filters.wilayaId ? { wilayaId: filters.wilayaId } : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { commune: { contains: filters.q, mode: "insensitive" } },
            { organizerName: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.from || filters.to
      ? {
          date: {
            ...(filters.from ? { gte: new Date(`${filters.from}T00:00:00.000Z`) } : {}),
            ...(filters.to ? { lte: new Date(`${filters.to}T00:00:00.000Z`) } : {}),
          },
        }
      : {}),
  };

  const orderBy: Prisma.CampaignOrderByWithRelationInput[] =
    filters.sort === "dateDesc"
      ? [{ date: "desc" }]
      : filters.sort === "newest"
        ? [{ createdAt: "desc" }]
        : [{ date: "asc" }];

  const [rows, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      select: campaignCardSelect,
      orderBy,
      skip: (filters.page - 1) * perPage,
      take: perPage,
    }),
    prisma.campaign.count({ where }),
  ]);

  const decorated = decorate(rows, await verifiedTreeCounts(rows.map((r) => r.id)));
  // Progress can only be ordered after the verified counts are known.
  if (filters.sort === "progress") decorated.sort((a, b) => b.progress - a.progress);

  return { items: decorated as CampaignCard[], total, perPage, page: filters.page };
}

export async function listHomeCampaigns(take = 3) {
  const rows = await prisma.campaign.findMany({
    where: { status: { in: ["ACTIVE", "UPCOMING"] } },
    select: campaignCardSelect,
    orderBy: [{ status: "asc" }, { date: "asc" }],
    take,
  });
  return decorate(rows, await verifiedTreeCounts(rows.map((r) => r.id))) as CampaignCard[];
}

export async function getCampaignDetail(id: string, viewerId?: string | null) {
  const campaign = await prisma.campaign.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      wilaya: true,
      createdBy: { select: { id: true, name: true } },
      _count: { select: { participants: { where: { status: { in: ["REGISTERED", "ATTENDED"] } } } } },
    },
  });
  if (!campaign) return null;

  const [verifiedTrees, participation] = await Promise.all([
    prisma.tree.count({ where: { campaignId: campaign.id, status: "VERIFIED" } }),
    viewerId
      ? prisma.campaignParticipant.findUnique({
          where: { campaignId_userId: { campaignId: campaign.id, userId: viewerId } },
        })
      : Promise.resolve(null),
  ]);

  return {
    ...campaign,
    verifiedTrees,
    progress: progressPercent(verifiedTrees, campaign.targetTrees),
    participation,
  };
}

export type JoinResult =
  | { ok: true; alreadyJoined: boolean }
  | { ok: false; reason: "not_found" | "closed" | "full" };

export async function joinCampaign(campaignId: string, userId: string): Promise<JoinResult> {
  return prisma.$transaction(async (tx) => {
    const campaign = await tx.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, title: true, status: true, maxParticipants: true },
    });
    if (!campaign) return { ok: false, reason: "not_found" } as const;
    if (!["UPCOMING", "ACTIVE"].includes(campaign.status)) return { ok: false, reason: "closed" } as const;

    const existing = await tx.campaignParticipant.findUnique({
      where: { campaignId_userId: { campaignId, userId } },
    });
    if (existing && existing.status !== "CANCELLED") return { ok: true, alreadyJoined: true } as const;

    if (campaign.maxParticipants != null) {
      const current = await tx.campaignParticipant.count({
        where: { campaignId, status: { in: ["REGISTERED", "ATTENDED"] } },
      });
      if (current >= campaign.maxParticipants) return { ok: false, reason: "full" } as const;
    }

    // The unique constraint on (campaignId, userId) is what actually prevents
    // a double join under concurrency; upsert keeps the happy path clean.
    await tx.campaignParticipant.upsert({
      where: { campaignId_userId: { campaignId, userId } },
      create: { campaignId, userId, status: "REGISTERED" },
      update: { status: "REGISTERED", joinedAt: new Date() },
    });

    await notify(tx, { userId, type: "CAMPAIGN_JOINED", data: { campaign: campaign.title, campaignId } });
    return { ok: true, alreadyJoined: false } as const;
  });
}

export async function leaveCampaign(campaignId: string, userId: string) {
  await prisma.campaignParticipant.updateMany({
    where: { campaignId, userId, status: "REGISTERED" },
    data: { status: "CANCELLED" },
  });
}

export type AttendanceResult =
  | { ok: true; already: boolean; campaignTitle: string; campaignId: string }
  | { ok: false; reason: "invalid_token" | "not_participant" | "closed" };

/**
 * Attendance is recorded from the campaign's server-side token, and the
 * timestamp is taken from the server clock — a client-supplied time is never
 * trusted.
 */
export async function recordAttendance(token: string, userId: string): Promise<AttendanceResult> {
  return prisma.$transaction(async (tx) => {
    const campaign = await tx.campaign.findUnique({
      where: { attendanceToken: token },
      select: { id: true, title: true, status: true },
    });
    if (!campaign) return { ok: false, reason: "invalid_token" } as const;
    if (!["UPCOMING", "ACTIVE", "COMPLETED"].includes(campaign.status)) {
      return { ok: false, reason: "closed" } as const;
    }

    const participation = await tx.campaignParticipant.findUnique({
      where: { campaignId_userId: { campaignId: campaign.id, userId } },
    });
    if (!participation || participation.status === "CANCELLED") {
      return { ok: false, reason: "not_participant" } as const;
    }
    if (participation.attendedAt) {
      return { ok: true, already: true, campaignTitle: campaign.title, campaignId: campaign.id } as const;
    }

    await tx.campaignParticipant.update({
      where: { id: participation.id },
      data: { status: "ATTENDED", attendedAt: new Date() },
    });
    await notify(tx, {
      userId,
      type: "ATTENDANCE_RECORDED",
      data: { campaign: campaign.title, campaignId: campaign.id },
    });
    return { ok: true, already: false, campaignTitle: campaign.title, campaignId: campaign.id } as const;
  });
}

async function uniqueSlug(title: string, excludeId?: string) {
  const base = slugify(title);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const clash = await prisma.campaign.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!clash || clash.id === excludeId) return candidate;
  }
  return `${base}-${randomToken(4).toLowerCase()}`;
}

export async function createCampaign(input: CampaignInput, actorId: string, ip?: string | null) {
  const slug = await uniqueSlug(input.title);
  return prisma.$transaction(async (tx) => {
    const campaign = await tx.campaign.create({
      data: {
        slug,
        title: input.title,
        description: input.description,
        coverImageUrl: input.coverImageUrl ?? null,
        wilayaId: input.wilayaId,
        commune: input.commune,
        locationLabel: input.locationLabel ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        date: input.date,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        targetTrees: input.targetTrees,
        maxParticipants: input.maxParticipants ?? null,
        organizerName: input.organizerName,
        status: input.status,
        attendanceToken: randomToken(18),
        createdById: actorId,
        publishedAt: input.status === "DRAFT" ? null : new Date(),
      },
    });
    await recordAudit(tx, {
      actorId,
      action: "campaign.created",
      entityType: "Campaign",
      entityId: campaign.id,
      metadata: { title: campaign.title, status: campaign.status },
      ip,
    });
    return campaign;
  });
}

export async function updateCampaign(
  campaignId: string,
  input: CampaignInput,
  actorId: string,
  ip?: string | null,
) {
  const current = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, title: true, slug: true, status: true },
  });
  if (!current) return null;
  const slug = current.title === input.title ? current.slug : await uniqueSlug(input.title, campaignId);

  return prisma.$transaction(async (tx) => {
    const campaign = await tx.campaign.update({
      where: { id: campaignId },
      data: {
        slug,
        title: input.title,
        description: input.description,
        coverImageUrl: input.coverImageUrl ?? null,
        wilayaId: input.wilayaId,
        commune: input.commune,
        locationLabel: input.locationLabel ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        date: input.date,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        targetTrees: input.targetTrees,
        maxParticipants: input.maxParticipants ?? null,
        organizerName: input.organizerName,
        status: input.status,
        publishedAt:
          input.status === "DRAFT" ? null : current.status === "DRAFT" ? new Date() : undefined,
      },
    });

    await recordAudit(tx, {
      actorId,
      action: "campaign.updated",
      entityType: "Campaign",
      entityId: campaign.id,
      metadata: { title: campaign.title, status: campaign.status },
      ip,
    });

    const participants = await tx.campaignParticipant.findMany({
      where: { campaignId, status: { in: ["REGISTERED", "ATTENDED"] } },
      select: { userId: true },
    });
    const isCancelled = campaign.status === "CANCELLED" && current.status !== "CANCELLED";
    await notifyMany(
      tx,
      participants.map((p) => p.userId),
      isCancelled ? "CAMPAIGN_CANCELLED" : "CAMPAIGN_UPDATED",
      { campaign: campaign.title, campaignId: campaign.id },
    );

    return campaign;
  });
}

export async function changeCampaignStatus(
  campaignId: string,
  status: CampaignStatus,
  actorId: string,
  ip?: string | null,
) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, title: true, status: true },
    });
    if (!current) return null;

    const campaign = await tx.campaign.update({
      where: { id: campaignId },
      data: {
        status,
        publishedAt: status === "DRAFT" ? null : current.status === "DRAFT" ? new Date() : undefined,
      },
    });

    await recordAudit(tx, {
      actorId,
      action: "campaign.status_changed",
      entityType: "Campaign",
      entityId: campaignId,
      metadata: { from: current.status, to: status, title: current.title },
      ip,
    });

    if (status === "CANCELLED" && current.status !== "CANCELLED") {
      const participants = await tx.campaignParticipant.findMany({
        where: { campaignId, status: { in: ["REGISTERED", "ATTENDED"] } },
        select: { userId: true },
      });
      await notifyMany(tx, participants.map((p) => p.userId), "CAMPAIGN_CANCELLED", {
        campaign: current.title,
        campaignId,
      });
    }
    return campaign;
  });
}

export async function listCampaignsForUser(userId: string) {
  const participation = await prisma.campaignParticipant.findMany({
    where: { userId, status: { in: ["REGISTERED", "ATTENDED"] } },
    orderBy: { joinedAt: "desc" },
    include: {
      campaign: {
        select: {
          id: true, slug: true, title: true, date: true, commune: true, status: true, targetTrees: true,
          wilaya: { select: { id: true, code: true, nameAr: true, nameFr: true, nameEn: true } },
        },
      },
    },
  });

  const campaignIds = participation.map((p) => p.campaignId);
  const submitted = campaignIds.length
    ? await prisma.tree.groupBy({
        by: ["campaignId"],
        where: { userId, campaignId: { in: campaignIds } },
        _count: { _all: true },
      })
    : [];
  const submittedMap = new Map(submitted.map((row) => [row.campaignId as string, row._count._all]));

  return participation.map((p) => ({ ...p, treesSubmitted: submittedMap.get(p.campaignId) ?? 0 }));
}

/** Campaigns a user may attach a tree submission to. */
export async function listJoinableCampaignsForUser(userId: string) {
  const rows = await prisma.campaignParticipant.findMany({
    where: { userId, status: { in: ["REGISTERED", "ATTENDED"] }, campaign: { status: { in: ["ACTIVE", "UPCOMING", "COMPLETED"] } } },
    select: { campaign: { select: { id: true, title: true, date: true } } },
    orderBy: { campaign: { date: "desc" } },
    take: 50,
  });
  return rows.map((row) => row.campaign);
}
