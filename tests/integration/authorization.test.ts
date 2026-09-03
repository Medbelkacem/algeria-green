import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { registerUser } from "@/services/auth.service";
import { submitTree } from "@/services/tree.service";
import { getPublicTree } from "@/services/tree.service";
import { reviewTree } from "@/services/tree.service";
import { getPublicProfile, setUserRole, setUserStatus } from "@/services/user.service";
import { canAssignRole, canModerateUser } from "@/lib/permissions";
import { resetContent, uniqueEmail } from "./helpers";

async function makeUser(prefix: string, role: "USER" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN" = "USER") {
  const email = uniqueEmail(prefix);
  const result = await registerUser({
    name: `${prefix} user`, email, password: "greenalgeria1", wilayaId: 16, locale: "ar",
  });
  if (!result.ok) throw new Error("could not create user");
  if (role !== "USER") await prisma.user.update({ where: { id: result.userId }, data: { role } });
  return { id: result.userId, email, role };
}

describe("privilege escalation guards", () => {
  beforeEach(resetContent);
  afterAll(async () => {
    await resetContent();
    await prisma.$disconnect();
  });

  it("stops an admin promoting themselves", async () => {
    const admin = await makeUser("admin", "ADMIN");
    const decision = canAssignRole(
      { id: admin.id, role: "ADMIN", status: "ACTIVE" },
      admin.id,
      "ADMIN",
      "SUPER_ADMIN",
    );
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe("self");

    const unchanged = await prisma.user.findUniqueOrThrow({ where: { id: admin.id } });
    expect(unchanged.role).toBe("ADMIN");
  });

  it("stops a super admin minting another super admin", async () => {
    const superAdmin = await makeUser("super", "SUPER_ADMIN");
    const member = await makeUser("member");
    const decision = canAssignRole(
      { id: superAdmin.id, role: "SUPER_ADMIN", status: "ACTIVE" },
      member.id,
      "USER",
      "SUPER_ADMIN" as never,
    );
    expect(decision.allowed).toBe(false);
  });

  it("stops an admin suspending a peer", async () => {
    const admin = await makeUser("admin", "ADMIN");
    const peer = await makeUser("peer", "ADMIN");
    const decision = canModerateUser({ id: admin.id, role: "ADMIN", status: "ACTIVE" }, peer.id, "ADMIN");
    expect(decision.allowed).toBe(false);
  });

  it("terminates every session when an account is suspended", async () => {
    const admin = await makeUser("admin", "ADMIN");
    const member = await makeUser("member");
    await prisma.session.create({
      data: { id: "test-session-id", userId: member.id, expiresAt: new Date(Date.now() + 3_600_000) },
    });

    await setUserStatus(member.id, "SUSPENDED", admin.id);

    expect(await prisma.session.count({ where: { userId: member.id } })).toBe(0);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: member.id } })).status).toBe("SUSPENDED");
    expect(await prisma.auditLog.count({ where: { action: "user.suspended", entityId: member.id } })).toBe(1);
  });

  it("terminates every session when a role changes", async () => {
    const superAdmin = await makeUser("super", "SUPER_ADMIN");
    const member = await makeUser("member");
    await prisma.session.create({
      data: { id: "role-session-id", userId: member.id, expiresAt: new Date(Date.now() + 3_600_000) },
    });

    await setUserRole(member.id, "MODERATOR", superAdmin.id);

    expect(await prisma.session.count({ where: { userId: member.id } })).toBe(0);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: member.id } })).role).toBe("MODERATOR");
    expect(await prisma.auditLog.count({ where: { action: "user.role_changed", entityId: member.id } })).toBe(1);
  });
});

describe("public data exposure", () => {
  beforeEach(resetContent);
  afterAll(async () => {
    await resetContent();
    await prisma.$disconnect();
  });

  const baseTree = {
    speciesId: 1,
    plantingDate: new Date("2026-02-01T00:00:00.000Z"),
    wilayaId: 9,
    commune: "Blida",
    anonymous: false,
  } as Parameters<typeof submitTree>[0];

  it("does not serve a pending tree on the public page", async () => {
    const member = await makeUser("member");
    const submitted = await submitTree(baseTree, member.id);
    if (!submitted.ok) throw new Error("submission failed");
    expect(await getPublicTree(submitted.publicId)).toBeNull();
  });

  it("exposes no private field on a verified tree", async () => {
    const admin = await makeUser("admin", "ADMIN");
    const member = await makeUser("member");
    const submitted = await submitTree(
      { ...baseTree, latitude: 36.752887, longitude: 3.042048, notes: "derrière la maison" } as typeof baseTree,
      member.id,
    );
    if (!submitted.ok) throw new Error("submission failed");
    await reviewTree({ treeId: submitted.id, action: "APPROVED", reason: null }, admin.id);

    const publicTree = await getPublicTree(submitted.publicId);
    expect(publicTree).not.toBeNull();

    const serialised = JSON.stringify(publicTree);
    expect(serialised).not.toContain(member.email);
    expect(serialised).not.toContain("36.752887");
    expect(serialised).not.toContain("derrière la maison");
    expect(publicTree!.latitude).toBe(36.75);
  });

  it("hides the planter's name when the submission is anonymous", async () => {
    const admin = await makeUser("admin", "ADMIN");
    const member = await makeUser("member");
    const submitted = await submitTree({ ...baseTree, anonymous: true } as typeof baseTree, member.id);
    if (!submitted.ok) throw new Error("submission failed");
    await reviewTree({ treeId: submitted.id, action: "APPROVED", reason: null }, admin.id);

    const publicTree = await getPublicTree(submitted.publicId);
    expect(publicTree!.planter).toBeNull();
  });

  it("hides a private profile entirely", async () => {
    const member = await makeUser("member");
    expect(await getPublicProfile(member.id)).not.toBeNull();

    await prisma.user.update({ where: { id: member.id }, data: { publicProfile: false } });
    expect(await getPublicProfile(member.id)).toBeNull();
  });

  it("never returns an email address in a public profile", async () => {
    const member = await makeUser("member");
    const profile = await getPublicProfile(member.id);
    expect(JSON.stringify(profile)).not.toContain(member.email);
  });
});
