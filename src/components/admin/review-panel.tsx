"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, MessageSquareWarning, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { Locale } from "@/i18n/config";
import { useTranslator } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { reviewTreeAction } from "@/server/actions/tree.actions";
import { idleState, type ActionState } from "@/server/action-state";

export function ReviewPanel({
  treeId,
  locale,
}: {
  treeId: string;
  locale: Locale;
}) {
  const t = useTranslator(locale);
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(reviewTreeAction, idleState);
  const [action, setAction] = React.useState<"APPROVED" | "REJECTED" | "CORRECTION_REQUESTED">("APPROVED");

  React.useEffect(() => {
    if (state.status === "success") {
      toast.success(t(state.message ?? "admin.approved"));
      router.refresh();
    } else if (state.status === "error") {
      toast.error(t(state.message ?? "errors.generic", state.values));
    }
  }, [state, router, t]);

  const reasonRequired = action !== "APPROVED";

  return (
    <form action={formAction} className="space-y-3 border-t pt-4">
      <input type="hidden" name="treeId" value={treeId} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="action" value={action} />

      <div className="space-y-1.5">
        <Label htmlFor={`reason-${treeId}`}>
          {t("admin.reviewReasonLabel")}
          {reasonRequired ? <span className="text-destructive">*</span> : null}
        </Label>
        <Textarea
          id={`reason-${treeId}`}
          name="reason"
          maxLength={500}
          rows={2}
          required={reasonRequired}
          aria-invalid={Boolean(state.fieldErrors?.reason)}
        />
        {state.fieldErrors?.reason ? (
          <p role="alert" className="text-sm text-destructive">
            {t(state.fieldErrors.reason)}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          size="sm"
          variant="success"
          disabled={pending}
          onClick={() => setAction("APPROVED")}
        >
          {pending && action === "APPROVED" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="size-4" aria-hidden="true" />
          )}
          {t("actions.approve")}
        </Button>
        <Button
          type="submit"
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() => setAction("REJECTED")}
        >
          <XCircle className="size-4" aria-hidden="true" />
          {t("actions.reject")}
        </Button>
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => setAction("CORRECTION_REQUESTED")}
        >
          <MessageSquareWarning className="size-4" aria-hidden="true" />
          {t("actions.requestCorrection")}
        </Button>
      </div>
    </form>
  );
}
