"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import type { Locale } from "@/i18n/config";
import { useTranslator } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { changeCampaignStatusAction } from "@/server/actions/campaign.actions";
import { idleState, type ActionState } from "@/server/action-state";

type Status = "DRAFT" | "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

const TRANSITIONS: Record<Status, Status[]> = {
  DRAFT: ["UPCOMING", "ACTIVE", "CANCELLED"],
  UPCOMING: ["ACTIVE", "COMPLETED", "CANCELLED", "DRAFT"],
  ACTIVE: ["COMPLETED", "CANCELLED"],
  COMPLETED: ["ACTIVE"],
  CANCELLED: ["DRAFT", "UPCOMING"],
};

export function CampaignStatusActions({
  campaignId,
  status,
  locale,
}: {
  campaignId: string;
  status: Status;
  locale: Locale;
}) {
  const t = useTranslator(locale);
  const router = useRouter();
  const [state, formAction] = useActionState<ActionState, FormData>(changeCampaignStatusAction, idleState);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [next, setNext] = React.useState<Status>(status);

  React.useEffect(() => {
    if (state.status === "success") {
      toast.success(t(state.message ?? "admin.campaignUpdated"));
      router.refresh();
    } else if (state.status === "error") {
      toast.error(t(state.message ?? "errors.generic", state.values));
    }
  }, [state, router, t]);

  return (
    <>
      <form ref={formRef} action={formAction} className="hidden">
        <input type="hidden" name="campaignId" value={campaignId} />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="status" value={next} />
      </form>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={t("campaign.status")}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("campaign.status")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {TRANSITIONS[status].map((target) => (
            <DropdownMenuItem
              key={target}
              variant={target === "CANCELLED" ? "destructive" : "default"}
              onSelect={() => {
                setNext(target);
                // The hidden input must carry the new value before submitting.
                React.startTransition(() => {
                  requestAnimationFrame(() => formRef.current?.requestSubmit());
                });
              }}
            >
              {t(`campaignStatus.${target}`)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
