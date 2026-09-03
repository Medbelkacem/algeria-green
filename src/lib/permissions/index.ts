import "server-only";
import type { SessionUser } from "@/lib/auth/session";

export type Role = SessionUser["role"];

/** Ordered so that new roles can be inserted without touching call sites. */
const ROLE_RANK: Record<Role, number> = {
  USER: 0,
  ASSOCIATION: 1,
  MODERATOR: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

export type Permission =
  | "campaign:create"
  | "campaign:update"
  | "campaign:changeStatus"
  | "tree:review"
  | "user:list"
  | "user:suspend"
  | "user:changeRole"
  | "audit:read"
  | "admin:access";

const MINIMUM_ROLE: Record<Permission, Role> = {
  "campaign:create": "ADMIN",
  "campaign:update": "ADMIN",
  "campaign:changeStatus": "ADMIN",
  "tree:review": "MODERATOR",
  "user:list": "ADMIN",
  "user:suspend": "ADMIN",
  "user:changeRole": "SUPER_ADMIN",
  "audit:read": "ADMIN",
  "admin:access": "MODERATOR",
};

export function hasPermission(user: Pick<SessionUser, "role" | "status"> | null, permission: Permission): boolean {
  if (!user || user.status !== "ACTIVE") return false;
  return ROLE_RANK[user.role] >= ROLE_RANK[MINIMUM_ROLE[permission]];
}

export function roleRank(role: Role) {
  return ROLE_RANK[role];
}

/**
 * A user may only assign roles strictly below their own, and never to
 * themselves — this is what stops an admin escalating their own privileges.
 */
export function canAssignRole(
  actor: Pick<SessionUser, "id" | "role" | "status">,
  targetUserId: string,
  targetCurrentRole: Role,
  nextRole: Role,
): { allowed: boolean; reason?: "self" | "forbidden" } {
  if (actor.id === targetUserId) return { allowed: false, reason: "self" };
  if (!hasPermission(actor, "user:changeRole")) return { allowed: false, reason: "forbidden" };
  const actorRank = ROLE_RANK[actor.role];
  if (ROLE_RANK[nextRole] >= actorRank) return { allowed: false, reason: "forbidden" };
  if (ROLE_RANK[targetCurrentRole] >= actorRank) return { allowed: false, reason: "forbidden" };
  return { allowed: true };
}

export function canModerateUser(
  actor: Pick<SessionUser, "id" | "role" | "status">,
  targetUserId: string,
  targetRole: Role,
): { allowed: boolean; reason?: "self" | "forbidden" } {
  if (actor.id === targetUserId) return { allowed: false, reason: "self" };
  if (!hasPermission(actor, "user:suspend")) return { allowed: false, reason: "forbidden" };
  if (ROLE_RANK[targetRole] >= ROLE_RANK[actor.role]) return { allowed: false, reason: "forbidden" };
  return { allowed: true };
}

export const ASSIGNABLE_ROLES: Role[] = ["USER", "ASSOCIATION", "MODERATOR", "ADMIN"];
