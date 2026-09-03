import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { registerUser } from "@/services/auth.service";
import {
  changeCampaignStatus, createCampaign, joinCampaign, recordAttendance,
} from "@/services/campaign.service";
import { getUserTreeStats, listPendingTrees, reviewTree, submitTree } from "@/services/tree.service";
import { getPublicStats } from "@/services/analytics.service";
import { progressPercent } from "@/lib/utils";
import { resetContent, uniqueEmail } from "./helpers";

async function makeUser(prefix: string, role: "USER" | "ADMIN" = "USER") {
  const email = uniqueEmail(prefix);
  const result = await registerUser({
    name: `${prefix} user`, email, password: "greenalgeria1", wilayaId: 16, locale: "ar",
  });
  if (!result.ok) throw new Error("could not create user");
  if (role !== "USER") await prisma.user.update({ where: { id: result.userId }, data: { role } });
  return { id: result.userId, email };
}

async function makeCampaign(adminId: string, overrides: Partial<Parameters<typeof createCampaign>[0]> = {}) {
  return createCampaign(
    {
      title: `Reboisement ${Math.random().toString(36).slice(2, 8)}`,
      description: "Une campagne communautaire de reboisement organisée pour les tests.",
      coverImageUrl: null,
      wilayaId: 9,
      commune: "Blida",
      locationLabel: null,
      latitude: null,
      longitude: null,
      date: new Date("2026-11-20T00:00:00.000Z"),
      startTime: "09:00",
      endTime: "14:00",
      targetTrees: 1000,
      maxParticipants: null,
      organizerName: "Association test",
      status: "ACTIVE",
      ...overrides,
    } as Parameters<typeof createCampaign>[0],
    adminId,
  );
}

const treeInput = {
  speciesId: 1,
  plantingDate: new Date("2026-02-01T00:00:00.000Z"),
  wilayaId: 9,
  commune: "Blida",
  anonymous: false,
} as Parameters<typeof submitTree>[0];

describe("campaign participation", () => {
  beforeEach(resetContent);
  afterAll(async () => {
    await resetContent();
    await prisma.$disconnect();
  });

  it("registers a participant and notifies them", async () => {
    const admin = await makeUser("admin", "ADMIN");
    const member = await makeUser("member");
    const campaign = await makeCampaign(admin.id);

    const result = await joinCampaign(campaign.id, member.id);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.alreadyJoined).toBe(false);

    const participation = await prisma.campaignParticipant.findUnique({
      where: { campaignId_userId: { campaignId: campaign.id, userId: member.id } },
    });
    expect(participation?.status).toBe("REGISTERED");

    const notification = await prisma.notification.findFirst({
      where: { userId: member.id, type: "CAMPAIGN_JOINED" },
    });
    expect(notification).not.toBeNull();
  });

  it("never creates a second participation for the same user", async () => {
    const admin = await makeUser("admin", "ADMIN");
    const member = await makeUser("member");
    const campaign = await makeCampaign(admin.id);

    await joinCampaign(campaign.id, member.id);
    const second = await joinCampaign(campaign.id, member.id);
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.alreadyJoined).toBe(true);

    const count = await prisma.campaignParticipant.count({ where: { campaignId: campaign.id } });
    expect(count).toBe(1);
  });

  it("refuses to exceed the participant limit", async () => {
    const admin = await makeUser("admin", "ADMIN");
    const first = await makeUser("first");
    const second = await makeUser("second");
    const campaign = await makeCampaign(admin.id, { maxParticipants: 1 } as never);

    expect((await joinCampaign(campaign.id, first.id)).ok).toBe(true);
    const overflow = await joinCampaign(campaign.id, second.id);
    expect(overflow.ok).toBe(false);
    if (!overflow.ok) expect(overflow.reason).toBe("full");
  });

  it("refuses to join a cancelled campaign", async () => {
    const admin = await makeUser("admin", "ADMIN");
    const member = await makeUser("member");
    const campaign = await makeCampaign(admin.id);
    await changeCampaignStatus(campaign.id, "CANCELLED", admin.id);

    const result = await joinCampaign(campaign.id, member.id);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("closed");
  });

  it("records attendance once, from the server clock, for participants only", async () => {
    const admin = await makeUser("admin", "ADMIN");
    const member = await makeUser("member");
    const stranger = await makeUser("stranger");
    const campaign = await makeCampaign(admin.id);
    const token = (await prisma.campaign.findUniqueOrThrow({ where: { id: campaign.id } })).attendanceToken;

    const outsider = await recordAttendance(token, stranger.id);
    expect(outsider.ok).toBe(false);
    if (!outsider.ok) expect(outsider.reason).toBe("not_participant");

    await joinCampaign(campaign.id, member.id);
    const first = await recordAttendance(token, member.id);
    expect(first.ok).toBe(true);
    if (first.ok) expect(first.already).toBe(false);

    const repeat = await recordAttendance(token, member.id);
    expect(repeat.ok).toBe(true);
    if (repeat.ok) expect(repeat.already).toBe(true);

    const participation = await prisma.campaignParticipant.findUniqueOrThrow({
      where: { campaignId_userId: { campaignId: campaign.id, userId: member.id } },
    });
    expect(participation.status).toBe("ATTENDED");
    expect(participation.attendedAt).toBeInstanceOf(Date);
  });

  it("rejects an invalid attendance token", async () => {
    const member = await makeUser("member");
    const result = await recordAttendance("not-a-token", member.id);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("invalid_token");
  });
});

describe("tree submission and verification", () => {
  beforeEach(resetContent);
  afterAll(async () => {
    await resetContent();
    await prisma.$disconnect();
  });

  it("stores an individual submission as PENDING with a public id", async () => {
    const member = await makeUser("member");
    const result = await submitTree(treeInput, member.id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.publicId).toMatch(/^DZG-TREE-[A-Z2-9]{8}$/);
    const tree = await prisma.tree.findUniqueOrThrow({ where: { id: result.id } });
    expect(tree.status).toBe("PENDING");
    expect(tree.campaignId).toBeNull();
  });

  it("keeps pending trees out of the public statistics", async () => {
    const member = await makeUser("member");
    await submitTree(treeInput, member.id);

    const stats = await getPublicStats();
    expect(stats.verifiedTrees).toBe(0);
  });

  it("coarsens shared coordinates before storing the public position", async () => {
    const member = await makeUser("member");
    const result = await submitTree(
      { ...treeInput, latitude: 36.752887, longitude: 3.042048 } as typeof treeInput,
      member.id,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const tree = await prisma.tree.findUniqueOrThrow({ where: { id: result.id } });
    expect(tree.latitude).toBeCloseTo(36.752887, 5);
    expect(tree.publicLatitude).toBe(36.75);
    expect(tree.publicLongitude).toBe(3.04);
  });

  it("refuses to attach a tree to a campaign the user has not joined", async () => {
    const admin = await makeUser("admin", "ADMIN");
    const stranger = await makeUser("stranger");
    const campaign = await makeCampaign(admin.id);

    const result = await submitTree({ ...treeInput, campaignId: campaign.id } as typeof treeInput, stranger.id);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not_participant");
    expect(await prisma.tree.count()).toBe(0);
  });

  it("approves a tree atomically: status, verification record, notification and audit log", async () => {
    const admin = await makeUser("admin", "ADMIN");
    const member = await makeUser("member");
    const submitted = await submitTree(treeInput, member.id);
    expect(submitted.ok).toBe(true);
    if (!submitted.ok) return;

    const review = await reviewTree({ treeId: submitted.id, action: "APPROVED", reason: null }, admin.id);
    expect(review.ok).toBe(true);

    const tree = await prisma.tree.findUniqueOrThrow({ where: { id: submitted.id } });
    expect(tree.status).toBe("VERIFIED");
    expect(tree.reviewedById).toBe(admin.id);
    expect(tree.reviewedAt).toBeInstanceOf(Date);

    expect(await prisma.treeVerification.count({ where: { treeId: submitted.id, action: "APPROVED" } })).toBe(1);
    expect(await prisma.notification.count({ where: { userId: member.id, type: "TREE_APPROVED" } })).toBe(1);
    expect(await prisma.auditLog.count({ where: { action: "tree.approved", entityId: submitted.id } })).toBe(1);

    const stats = await getPublicStats();
    expect(stats.verifiedTrees).toBe(1);
  });

  it("rejects a tree without ever counting it", async () => {
    const admin = await makeUser("admin", "ADMIN");
    const member = await makeUser("member");
    const submitted = await submitTree(treeInput, member.id);
    if (!submitted.ok) throw new Error("submission failed");

    const review = await reviewTree(
      { treeId: submitted.id, action: "REJECTED", reason: "Photo illisible" },
      admin.id,
    );
    expect(review.ok).toBe(true);

    const tree = await prisma.tree.findUniqueOrThrow({ where: { id: submitted.id } });
    expect(tree.status).toBe("REJECTED");
    expect(tree.reviewReason).toBe("Photo illisible");
    expect((await getPublicStats()).verifiedTrees).toBe(0);
    expect(await prisma.notification.count({ where: { userId: member.id, type: "TREE_REJECTED" } })).toBe(1);
  });

  it("keeps a tree pending when a correction is requested", async () => {
    const admin = await makeUser("admin", "ADMIN");
    const member = await makeUser("member");
    const submitted = await submitTree(treeInput, member.id);
    if (!submitted.ok) throw new Error("submission failed");

    await reviewTree(
      { treeId: submitted.id, action: "CORRECTION_REQUESTED", reason: "Commune manquante" },
      admin.id,
    );
    const tree = await prisma.tree.findUniqueOrThrow({ where: { id: submitted.id } });
    expect(tree.status).toBe("PENDING");
  });

  it("refuses to review the same tree twice", async () => {
    const admin = await makeUser("admin", "ADMIN");
    const member = await makeUser("member");
    const submitted = await submitTree(treeInput, member.id);
    if (!submitted.ok) throw new Error("submission failed");

    await reviewTree({ treeId: submitted.id, action: "APPROVED", reason: null }, admin.id);
    const second = await reviewTree({ treeId: submitted.id, action: "REJECTED", reason: "double" }, admin.id);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.reason).toBe("already_reviewed");
  });

  it("advances campaign progress only on verified trees", async () => {
    const admin = await makeUser("admin", "ADMIN");
    const member = await makeUser("member");
    const campaign = await makeCampaign(admin.id, { targetTrees: 4 } as never);
    await joinCampaign(campaign.id, member.id);

    const submissions = [];
    for (let i = 0; i < 4; i += 1) {
      const result = await submitTree({ ...treeInput, campaignId: campaign.id } as typeof treeInput, member.id);
      if (!result.ok) throw new Error("submission failed");
      submissions.push(result.id);
    }

    const beforeReview = await prisma.tree.count({ where: { campaignId: campaign.id, status: "VERIFIED" } });
    expect(progressPercent(beforeReview, 4)).toBe(0);

    await reviewTree({ treeId: submissions[0], action: "APPROVED", reason: null }, admin.id);
    await reviewTree({ treeId: submissions[1], action: "APPROVED", reason: null }, admin.id);
    await reviewTree({ treeId: submissions[2], action: "REJECTED", reason: "hors zone" }, admin.id);

    const verified = await prisma.tree.count({ where: { campaignId: campaign.id, status: "VERIFIED" } });
    expect(verified).toBe(2);
    expect(progressPercent(verified, 4)).toBe(50);
  });

  it("lists pending trees oldest first for review", async () => {
    const member = await makeUser("member");
    await submitTree(treeInput, member.id);
    await submitTree(treeInput, member.id);

    const { items, total } = await listPendingTrees(1);
    expect(total).toBe(2);
    expect(items).toHaveLength(2);
    expect(items[0].createdAt.getTime()).toBeLessThanOrEqual(items[1].createdAt.getTime());
  });

  it("reports per-user statistics from the database", async () => {
    const admin = await makeUser("admin", "ADMIN");
    const member = await makeUser("member");
    const first = await submitTree(treeInput, member.id);
    await submitTree(treeInput, member.id);
    if (!first.ok) throw new Error("submission failed");
    await reviewTree({ treeId: first.id, action: "APPROVED", reason: null }, admin.id);

    const stats = await getUserTreeStats(member.id);
    expect(stats.total).toBe(2);
    expect(stats.verified).toBe(1);
    expect(stats.pending).toBe(1);
  });
});

describe("public statistics on an empty database", () => {
  beforeEach(resetContent);
  afterAll(async () => {
    await resetContent();
    await prisma.$disconnect();
  });

  it("reports zeros rather than invented numbers", async () => {
    const stats = await getPublicStats();
    expect(stats).toEqual({ verifiedTrees: 0, campaigns: 0, participants: 0, wilayasCovered: 0 });
  });
});
