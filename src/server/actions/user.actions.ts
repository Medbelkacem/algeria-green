"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/current-user";
import { canAssignRole, canModerateUser, hasPermission } from "@/lib/permissions";
import { clientIp } from "@/lib/security/rate-limit";
import { prisma } from "@/lib/db/prisma";
import { setUserRole, setUserStatus } from "@/services/user.service";
import { markAllRead } from "@/services/notification.service";
import { resolveLocale } from "@/i18n/config";
import { errorState, successState, type ActionState } from "../action-state";

const statusSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

const roleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["USER", "ASSOCIATION", "MODERATOR", "ADMIN"]),
});

export async function setUserStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await getCurrentUser();
  if (!hasPermission(actor, "user:suspend")) return errorState("errors.forbiddenBody");

  const parsed = statusSchema.safeParse({ userId: formData.get("userId"), status: formData.get("status") });
  if (!parsed.success) return errorState("errors.generic");

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, role: true },
  });
  if (!target) return errorState("errors.notFoundBody");

  const check = canModerateUser(actor!, target.id, target.role);
  if (!check.allowed) {
    return errorState(check.reason === "self" ? "admin.cannotSuspendSelf" : "errors.forbiddenBody");
  }

  const headerList = await headers();
  await setUserStatus(target.id, parsed.data.status, actor!.id, clientIp(headerList));

  const locale = resolveLocale(formData.get("locale"));
  revalidatePath(`/${locale}/admin/users`);
  return successState(parsed.data.status === "SUSPENDED" ? "admin.userSuspended" : "admin.userReactivated");
}

export async function setUserRoleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await getCurrentUser();
  if (!hasPermission(actor, "user:changeRole")) return errorState("errors.forbiddenBody");

  const parsed = roleSchema.safeParse({ userId: formData.get("userId"), role: formData.get("role") });
  if (!parsed.success) return errorState("errors.generic");

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, role: true },
  });
  if (!target) return errorState("errors.notFoundBody");

  // Blocks self-promotion and any assignment at or above the actor's own rank.
  const check = canAssignRole(actor!, target.id, target.role, parsed.data.role);
  if (!check.allowed) {
    return errorState(check.reason === "self" ? "admin.cannotChangeOwnRole" : "errors.forbiddenBody");
  }

  const headerList = await headers();
  await setUserRole(target.id, parsed.data.role, actor!.id, clientIp(headerList));

  const locale = resolveLocale(formData.get("locale"));
  revalidatePath(`/${locale}/admin/users`);
  return successState("admin.roleChanged");
}

export async function markNotificationsReadAction(locale: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await markAllRead(user.id);
  revalidatePath(`/${resolveLocale(locale)}/dashboard/notifications`);
}
