import { describe, expect, it } from "vitest";
import { canAssignRole, canModerateUser, hasPermission } from "@/lib/permissions";

const admin = { id: "admin-1", role: "ADMIN" as const, status: "ACTIVE" as const };
const superAdmin = { id: "super-1", role: "SUPER_ADMIN" as const, status: "ACTIVE" as const };
const moderator = { id: "mod-1", role: "MODERATOR" as const, status: "ACTIVE" as const };
const member = { id: "user-1", role: "USER" as const, status: "ACTIVE" as const };

describe("hasPermission", () => {
  it("grants review rights from MODERATOR upward", () => {
    expect(hasPermission(moderator, "tree:review")).toBe(true);
    expect(hasPermission(admin, "tree:review")).toBe(true);
    expect(hasPermission(member, "tree:review")).toBe(false);
  });

  it("keeps campaign management above moderators", () => {
    expect(hasPermission(moderator, "campaign:create")).toBe(false);
    expect(hasPermission(admin, "campaign:create")).toBe(true);
  });

  it("reserves role changes for SUPER_ADMIN", () => {
    expect(hasPermission(admin, "user:changeRole")).toBe(false);
    expect(hasPermission(superAdmin, "user:changeRole")).toBe(true);
  });

  it("denies everything to an anonymous or suspended account", () => {
    expect(hasPermission(null, "admin:access")).toBe(false);
    expect(hasPermission({ ...admin, status: "SUSPENDED" }, "admin:access")).toBe(false);
    expect(hasPermission({ ...admin, status: "SUSPENDED" }, "campaign:create")).toBe(false);
  });
});

describe("canAssignRole", () => {
  it("blocks a user from changing their own role", () => {
    const result = canAssignRole(superAdmin, superAdmin.id, "SUPER_ADMIN", "SUPER_ADMIN");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("self");
  });

  it("blocks assigning a role at or above the actor's rank", () => {
    expect(canAssignRole(superAdmin, "target", "USER", "SUPER_ADMIN").allowed).toBe(false);
    expect(canAssignRole(superAdmin, "target", "USER", "ADMIN").allowed).toBe(true);
  });

  it("blocks acting on a target whose rank is not below the actor's", () => {
    expect(canAssignRole(superAdmin, "target", "SUPER_ADMIN", "USER").allowed).toBe(false);
  });

  it("blocks an ADMIN from changing roles at all", () => {
    expect(canAssignRole(admin, "target", "USER", "MODERATOR").allowed).toBe(false);
  });
});

describe("canModerateUser", () => {
  it("blocks self-suspension", () => {
    expect(canModerateUser(admin, admin.id, "ADMIN").reason).toBe("self");
  });

  it("blocks suspending a peer or a superior", () => {
    expect(canModerateUser(admin, "other-admin", "ADMIN").allowed).toBe(false);
    expect(canModerateUser(admin, "the-super", "SUPER_ADMIN").allowed).toBe(false);
  });

  it("allows suspending a lower-ranked account", () => {
    expect(canModerateUser(admin, "member", "USER").allowed).toBe(true);
  });
});
