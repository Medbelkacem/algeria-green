"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ActionState } from "@/server/action-state";
import type { Locale } from "@/i18n/config";
import { useTranslator } from "@/i18n/client";

export function FormMessage({ state, locale }: { state: ActionState; locale: Locale }) {
  const t = useTranslator(locale);
  if (state.status === "idle" || !state.message) return null;
  const isError = state.status === "error";
  return (
    <Alert variant={isError ? "destructive" : "success"}>
      {isError ? <AlertCircle aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
      <AlertDescription className="text-foreground">{t(state.message, state.values)}</AlertDescription>
    </Alert>
  );
}

export function FieldError({ message, locale }: { message?: string; locale: Locale }) {
  const t = useTranslator(locale);
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {t(message, { min: 2, max: 80 })}
    </p>
  );
}
