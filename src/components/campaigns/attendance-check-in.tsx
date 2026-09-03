"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2, QrCode } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { useTranslator } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { recordAttendanceAction } from "@/server/actions/campaign.actions";
import { idleState, type ActionState } from "@/server/action-state";

export function AttendanceCheckIn({
  token,
  locale,
}: {
  token: string;
  locale: Locale;
}) {
  const t = useTranslator(locale);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    recordAttendanceAction,
    idleState,
  );

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-success/12 text-success">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </div>
        <p className="font-medium">{t(state.message ?? "campaign.attendanceRecorded")}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="locale" value={locale} />

      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertDescription className="text-foreground">
            {t(state.message ?? "errors.generic", state.values)}
          </AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <QrCode className="size-4" aria-hidden="true" />}
        {t("campaign.attendanceTitle")}
      </Button>
    </form>
  );
}
