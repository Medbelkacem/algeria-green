"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/components/ui/button";
import { markNotificationsReadAction } from "@/server/actions/user.actions";

export function MarkAllReadButton({ locale, label }: { locale: Locale; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await markNotificationsReadAction(locale);
          router.refresh();
        })
      }
    >
      <CheckCheck className="size-4" aria-hidden="true" />
      {label}
    </Button>
  );
}
