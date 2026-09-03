"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/permissions";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { storeImage } from "@/lib/security/storage";
import { MAX_UPLOAD_MB } from "@/lib/validation/upload";
import { treeReviewSchema, treeSubmissionSchema } from "@/lib/validation/tree";
import { reviewTree, submitTree } from "@/services/tree.service";
import { resolveLocale } from "@/i18n/config";
import { errorState, fieldErrorsFrom, successState, type ActionState } from "../action-state";

export async function submitTreeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return errorState("plant.signInRequired");
  if (user.status !== "ACTIVE") return errorState("auth.accountSuspended");

  const locale = resolveLocale(formData.get("locale"));
  const headerList = await headers();
  const limited = await rateLimit(`tree:${clientIp(headerList)}:${user.id}`, 30, 60 * 60);
  if (!limited.ok) {
    return errorState("auth.rateLimited", { values: { seconds: limited.retryAfterSeconds } });
  }

  // The photo is uploaded first so a storage failure never leaves a half-written tree.
  let photoUrl: string | null = null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const uploaded = await storeImage(photo, "tree");
    if (!uploaded.ok) {
      const message =
        uploaded.reason === "too_large"
          ? "validation.fileTooLarge"
          : uploaded.reason === "no_storage"
            ? "errors.generic"
            : "validation.fileType";
      return errorState(message, {
        values: { size: MAX_UPLOAD_MB },
        fieldErrors: { photo: message },
      });
    }
    photoUrl = uploaded.url;
  }

  const raw = Object.fromEntries(
    Array.from(formData.entries()).filter(([key, value]) => key !== "photo" && typeof value === "string"),
  );
  const parsed = treeSubmissionSchema.safeParse({
    ...raw,
    photoUrl,
    anonymous: formData.get("anonymous") === "on" || formData.get("anonymous") === "true",
  });
  if (!parsed.success) {
    return errorState("errors.generic", { fieldErrors: fieldErrorsFrom(parsed.error.issues) });
  }

  const result = await submitTree(parsed.data, user.id);
  if (!result.ok) {
    const message =
      result.reason === "not_participant" ? "campaign.signInToJoin" : "errors.generic";
    return errorState(message, { fieldErrors: { campaignId: message } });
  }

  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/dashboard/trees`);
  return successState("plant.successTitle", { data: { publicId: result.publicId } });
}

export async function reviewTreeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  // Authorisation is enforced here, on the server, not in the calling component.
  if (!hasPermission(user, "tree:review")) return errorState("errors.forbiddenBody");

  const headerList = await headers();
  const parsed = treeReviewSchema.safeParse({
    treeId: formData.get("treeId"),
    action: formData.get("action"),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) {
    return errorState("admin.reviewReasonRequired", { fieldErrors: fieldErrorsFrom(parsed.error.issues) });
  }

  const result = await reviewTree(
    { treeId: parsed.data.treeId, action: parsed.data.action, reason: parsed.data.reason ?? null },
    user!.id,
    clientIp(headerList),
  );
  if (!result.ok) return errorState("errors.generic");

  const locale = resolveLocale(formData.get("locale"));
  revalidatePath(`/${locale}/admin/trees/pending`);
  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/impact`);

  const message =
    parsed.data.action === "APPROVED"
      ? "admin.approved"
      : parsed.data.action === "REJECTED"
        ? "admin.rejected"
        : "admin.correctionRequested";
  return successState(message);
}
