"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { Button } from "@/components/ui/button";

export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = createTranslator(DEFAULT_LOCALE);

  useEffect(() => {
    // Only the digest is surfaced; stack traces never reach the browser.
    console.error("Unhandled route error", error.digest);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-8" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("errors.serverTitle")}</h1>
      <p className="text-muted-foreground">{t("errors.serverBody")}</p>
      {error.digest ? <p className="font-mono text-xs text-muted-foreground">{error.digest}</p> : null}
      <Button onClick={reset}>{t("actions.retry")}</Button>
    </div>
  );
}
