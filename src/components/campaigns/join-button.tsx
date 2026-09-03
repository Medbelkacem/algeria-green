"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { CheckCircle2, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { Locale } from "@/i18n/config";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { joinCampaignAction } from "@/server/actions/campaign.actions";
import { idleState, type ActionState } from "@/server/action-state";
import { useTranslator } from "@/i18n/client";

export function JoinCampaignButton({
  campaignId,
  locale,
  isAuthenticated,
  alreadyJoined,
  disabledReason,
}: {
  campaignId: string;
  locale: Locale;
  isAuthenticated: boolean;
  alreadyJoined: boolean;
  disabledReason: "full" | "closed" | null;
}) {
  const t = useTranslator(locale);
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    joinCampaignAction,
    idleState,
  );

  React.useEffect(() => {
    if (state.status === "success") {
      toast.success(t(state.message ?? "campaign.joined"));
      router.refresh();
    } else if (state.status === "error") {
      toast.error(t(state.message ?? "errors.generic", state.values));
    }
  }, [state, router, t]);

  if (alreadyJoined) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/8 px-4 py-3 text-sm font-medium text-success">
        <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
        {t("campaign.joined")}
      </p>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link
        href={`/${locale}/sign-in?redirectTo=${encodeURIComponent(`/${locale}/campaigns/${campaignId}`)}`}
        className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
      >
        <LogIn className="size-4" aria-hidden="true" />
        {t("campaign.signInToJoin")}
      </Link>
    );
  }

  if (disabledReason) {
    return (
      <Button size="lg" disabled className="w-full sm:w-auto">
        {t(disabledReason === "full" ? "campaign.joinFull" : "campaign.joinClosed")}
      </Button>
    );
  }

  return (
    <form action={formAction} className="w-full sm:w-auto">
      <input type="hidden" name="campaignId" value={campaignId} />
      <input type="hidden" name="locale" value={locale} />
      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
        <UserPlus className="size-4" aria-hidden="true" />
        {pending ? t("actions.loading") : t("campaign.join")}
      </Button>
    </form>
  );
}
