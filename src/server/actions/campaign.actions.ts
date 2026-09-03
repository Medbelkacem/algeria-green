"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/permissions";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { storeImage } from "@/lib/security/storage";
import { MAX_UPLOAD_MB } from "@/lib/validation/upload";
import { campaignInputSchema, campaignStatusSchema } from "@/lib/validation/campaign";
import {
  changeCampaignStatus, createCampaign, joinCampaign, leaveCampaign, recordAttendance, updateCampaign,
} from "@/services/campaign.service";
import { resolveLocale } from "@/i18n/config";
import { errorState, fieldErrorsFrom, successState, type ActionState } from "../action-state";

export async function joinCampaignAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState("campaign.signInToJoin");
  if (user.status !== "ACTIVE") return errorState("auth.accountSuspended");

  const campaignId = String(formData.get("campaignId") ?? "");
  const locale = resolveLocale(formData.get("locale"));
  if (!campaignId) return errorState("errors.generic");

  const limited = await rateLimit(`join:${user.id}`, 30, 60 * 10);
  if (!limited.ok) {
    return errorState("auth.rateLimited", { values: { seconds: limited.retryAfterSeconds } });
  }

  const result = await joinCampaign(campaignId, user.id);
  if (!result.ok) {
    return errorState(
      result.reason === "full" ? "campaign.joinFull" : result.reason === "closed" ? "campaign.joinClosed" : "errors.generic",
    );
  }

  revalidatePath(`/${locale}/campaigns/${campaignId}`);
  revalidatePath(`/${locale}/dashboard/campaigns`);
  return successState("campaign.joined");
}

export async function leaveCampaignAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") return errorState("errors.unauthorizedBody");

  const campaignId = String(formData.get("campaignId") ?? "");
  const locale = resolveLocale(formData.get("locale"));
  if (!campaignId) return errorState("errors.generic");

  await leaveCampaign(campaignId, user.id);
  revalidatePath(`/${locale}/campaigns/${campaignId}`);
  revalidatePath(`/${locale}/dashboard/campaigns`);
  return successState("actions.confirm");
}

export async function recordAttendanceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState("campaign.signInToJoin");
  if (user.status !== "ACTIVE") return errorState("auth.accountSuspended");

  const token = String(formData.get("token") ?? "");
  const locale = resolveLocale(formData.get("locale"));
  if (!token) return errorState("errors.generic");

  const limited = await rateLimit(`attend:${user.id}`, 20, 60 * 10);
  if (!limited.ok) {
    return errorState("auth.rateLimited", { values: { seconds: limited.retryAfterSeconds } });
  }

  const result = await recordAttendance(token, user.id);
  if (!result.ok) {
    return errorState(
      result.reason === "not_participant" ? "campaign.signInToJoin" : "errors.generic",
    );
  }

  revalidatePath(`/${locale}/dashboard/campaigns`);
  return successState(result.already ? "campaign.attendanceAlready" : "campaign.attendanceRecorded", {
    data: { campaignId: result.campaignId },
  });
}

type CampaignFormResult =
  | { ok: false; error: ActionState }
  | { ok: true; parsed: ReturnType<typeof campaignInputSchema.safeParse> };

async function readCampaignForm(formData: FormData): Promise<CampaignFormResult> {
  const raw = Object.fromEntries(
    Array.from(formData.entries()).filter(([key, value]) => key !== "cover" && typeof value === "string"),
  );

  let coverImageUrl = String(formData.get("coverImageUrl") ?? "");
  const cover = formData.get("cover");
  if (cover instanceof File && cover.size > 0) {
    const uploaded = await storeImage(cover, "campaign");
    if (!uploaded.ok) {
      const key = uploaded.reason === "too_large" ? "validation.fileTooLarge" : "validation.fileType";
      return {
        ok: false,
        error: errorState(key, { values: { size: MAX_UPLOAD_MB }, fieldErrors: { cover: key } }),
      };
    }
    coverImageUrl = uploaded.url;
  }

  return { ok: true, parsed: campaignInputSchema.safeParse({ ...raw, coverImageUrl }) };
}

export async function createCampaignAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!hasPermission(user, "campaign:create")) return errorState("errors.forbiddenBody");

  const locale = resolveLocale(formData.get("locale"));
  const form = await readCampaignForm(formData);
  if (!form.ok) return form.error;
  if (!form.parsed.success) {
    return errorState("errors.generic", { fieldErrors: fieldErrorsFrom(form.parsed.error.issues) });
  }

  const headerList = await headers();
  await createCampaign(form.parsed.data, user!.id, clientIp(headerList));

  revalidatePath(`/${locale}/admin/campaigns`);
  revalidatePath(`/${locale}/campaigns`);
  redirect(`/${locale}/admin/campaigns`);
}

export async function updateCampaignAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!hasPermission(user, "campaign:update")) return errorState("errors.forbiddenBody");

  const campaignId = String(formData.get("campaignId") ?? "");
  const locale = resolveLocale(formData.get("locale"));
  if (!campaignId) return errorState("errors.generic");

  const form = await readCampaignForm(formData);
  if (!form.ok) return form.error;
  if (!form.parsed.success) {
    return errorState("errors.generic", { fieldErrors: fieldErrorsFrom(form.parsed.error.issues) });
  }

  const headerList = await headers();
  const updated = await updateCampaign(campaignId, form.parsed.data, user!.id, clientIp(headerList));
  if (!updated) return errorState("errors.notFoundBody");

  revalidatePath(`/${locale}/admin/campaigns`);
  revalidatePath(`/${locale}/campaigns`);
  revalidatePath(`/${locale}/campaigns/${updated.slug}`);
  return successState("admin.campaignUpdated");
}

export async function changeCampaignStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!hasPermission(user, "campaign:changeStatus")) return errorState("errors.forbiddenBody");

  const locale = resolveLocale(formData.get("locale"));
  const parsed = campaignStatusSchema.safeParse({
    campaignId: formData.get("campaignId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return errorState("errors.generic");

  const headerList = await headers();
  const updated = await changeCampaignStatus(
    parsed.data.campaignId,
    parsed.data.status,
    user!.id,
    clientIp(headerList),
  );
  if (!updated) return errorState("errors.notFoundBody");

  revalidatePath(`/${locale}/admin/campaigns`);
  revalidatePath(`/${locale}/campaigns`);
  return successState("admin.campaignUpdated");
}
