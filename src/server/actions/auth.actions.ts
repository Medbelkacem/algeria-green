"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createSession, destroyCurrentSession, destroyAllSessionsFor } from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import {
  changePasswordSchema, forgotPasswordSchema, resetPasswordSchema, signInSchema, signUpSchema,
  updateProfileSchema,
} from "@/lib/validation/auth";
import {
  authenticate, changePassword, registerUser, requestEmailVerification, requestPasswordReset,
  resetPasswordWithToken, verifyEmailToken,
} from "@/services/auth.service";
import { resolveLocale } from "@/i18n/config";
import { errorState, fieldErrorsFrom, successState, type ActionState } from "../action-state";

function formValues(formData: FormData) {
  return Object.fromEntries(
    Array.from(formData.entries()).filter(([, value]) => typeof value === "string"),
  ) as Record<string, string>;
}

async function requestMeta() {
  const headerList = await headers();
  return { ip: clientIp(headerList), userAgent: headerList.get("user-agent") };
}

export async function signUpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const locale = resolveLocale(formData.get("locale"));
  const { ip, userAgent } = await requestMeta();

  const limited = await rateLimit(`signup:${ip}`, 5, 60 * 15);
  if (!limited.ok) {
    return errorState("auth.rateLimited", { values: { seconds: limited.retryAfterSeconds } });
  }

  const parsed = signUpSchema.safeParse({ ...formValues(formData), locale });
  if (!parsed.success) {
    return errorState("errors.generic", { fieldErrors: fieldErrorsFrom(parsed.error.issues) });
  }

  const result = await registerUser({
    name: parsed.data.name,
    email: parsed.data.email,
    password: parsed.data.password,
    wilayaId: parsed.data.wilayaId ?? null,
    locale,
    ip,
  });

  if (!result.ok) {
    return errorState("auth.emailTaken", { fieldErrors: { email: "auth.emailTaken" } });
  }

  await createSession(result.userId, { ip, userAgent });
  redirect(`/${locale}/dashboard`);
}

export async function signInAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const locale = resolveLocale(formData.get("locale"));
  const redirectTo = String(formData.get("redirectTo") ?? "");
  const { ip, userAgent } = await requestMeta();

  const parsed = signInSchema.safeParse(formValues(formData));
  if (!parsed.success) {
    return errorState("errors.generic", { fieldErrors: fieldErrorsFrom(parsed.error.issues) });
  }

  // Two budgets: one per address, one per account, so a single attacker cannot
  // lock every user out by hammering one endpoint.
  const [byIp, byAccount] = await Promise.all([
    rateLimit(`signin:ip:${ip}`, 10, 60 * 10),
    rateLimit(`signin:acct:${parsed.data.email}`, 8, 60 * 10),
  ]);
  if (!byIp.ok || !byAccount.ok) {
    const retryAfterSeconds = Math.max(
      byIp.ok ? 0 : byIp.retryAfterSeconds,
      byAccount.ok ? 0 : byAccount.retryAfterSeconds,
    );
    return errorState("auth.rateLimited", { values: { seconds: retryAfterSeconds } });
  }

  const result = await authenticate(parsed.data.email, parsed.data.password);
  if (!result.ok) {
    return errorState(result.reason === "suspended" ? "auth.accountSuspended" : "auth.invalidCredentials");
  }

  await createSession(result.userId, { ip, userAgent });

  // Only same-origin relative paths are accepted, which closes the open-redirect hole.
  const safeTarget =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : `/${locale}/dashboard`;
  redirect(safeTarget);
}

export async function signOutAction(locale: string) {
  await destroyCurrentSession();
  redirect(`/${resolveLocale(locale)}`);
}

export async function forgotPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { ip } = await requestMeta();
  const limited = await rateLimit(`forgot:${ip}`, 5, 60 * 15);
  if (!limited.ok) {
    return errorState("auth.rateLimited", { values: { seconds: limited.retryAfterSeconds } });
  }

  const parsed = forgotPasswordSchema.safeParse(formValues(formData));
  if (!parsed.success) {
    return errorState("errors.generic", { fieldErrors: fieldErrorsFrom(parsed.error.issues) });
  }

  await requestPasswordReset(parsed.data.email);
  // Identical response whether or not the account exists.
  return successState("auth.forgotSent");
}

export async function resetPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { ip } = await requestMeta();
  const limited = await rateLimit(`reset:${ip}`, 8, 60 * 15);
  if (!limited.ok) {
    return errorState("auth.rateLimited", { values: { seconds: limited.retryAfterSeconds } });
  }

  const parsed = resetPasswordSchema.safeParse(formValues(formData));
  if (!parsed.success) {
    return errorState("errors.generic", { fieldErrors: fieldErrorsFrom(parsed.error.issues) });
  }

  const ok = await resetPasswordWithToken(parsed.data.token, parsed.data.password);
  return ok ? successState("auth.resetDone") : errorState("auth.resetInvalid");
}

export async function verifyEmailAction(token: string): Promise<boolean> {
  if (!token) return false;
  return verifyEmailToken(token);
}

export async function resendVerificationAction(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState("errors.unauthorizedBody");

  const limited = await rateLimit(`verify:${user.id}`, 3, 60 * 30);
  if (!limited.ok) {
    return errorState("auth.rateLimited", { values: { seconds: limited.retryAfterSeconds } });
  }

  const result = await requestEmailVerification(user.id);
  if (result.alreadyVerified) return successState("auth.verifyDone");
  return result.delivered
    ? successState("auth.verifySent")
    : successState("auth.emailDeliveryNote");
}

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") return errorState("errors.unauthorizedBody");

  const parsed = updateProfileSchema.safeParse({
    ...formValues(formData),
    publicProfile: formData.get("publicProfile") === "on" || formData.get("publicProfile") === "true",
  });
  if (!parsed.success) {
    return errorState("errors.generic", { fieldErrors: fieldErrorsFrom(parsed.error.issues) });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      wilayaId: parsed.data.wilayaId ?? null,
      locale: parsed.data.locale,
      publicProfile: parsed.data.publicProfile,
    },
  });

  revalidatePath(`/${parsed.data.locale}/dashboard/settings`);
  return successState("profile.updated", { data: { locale: parsed.data.locale } });
}

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") return errorState("errors.unauthorizedBody");

  const parsed = changePasswordSchema.safeParse(formValues(formData));
  if (!parsed.success) {
    return errorState("errors.generic", { fieldErrors: fieldErrorsFrom(parsed.error.issues) });
  }

  const result = await changePassword(user.id, parsed.data.currentPassword, parsed.data.password);
  if (!result.ok) {
    return errorState("auth.invalidCredentials", { fieldErrors: { currentPassword: "auth.invalidCredentials" } });
  }
  return successState("profile.passwordUpdated");
}

export async function signOutEverywhereAction(locale: string) {
  const user = await getCurrentUser();
  if (user) await destroyAllSessionsFor(user.id);
  redirect(`/${resolveLocale(locale)}/sign-in`);
}
