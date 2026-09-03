"use client";

import { useActionState } from "react";
import { Loader2, LogIn } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { useTranslator } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction } from "@/server/actions/auth.actions";
import { idleState, type ActionState } from "@/server/action-state";
import { FieldError, FormMessage } from "./form-message";

export function SignInForm({
  locale,
  redirectTo,
}: {
  locale: Locale;
  redirectTo?: string;
}) {
  const t = useTranslator(locale);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(signInAction, idleState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}

      <FormMessage state={state} locale={locale} />

      <div className="space-y-1.5">
        <Label htmlFor="email">{t("auth.email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          aria-invalid={Boolean(state.fieldErrors?.email)}
        />
        <FieldError message={state.fieldErrors?.email} locale={locale} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">{t("auth.password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          aria-invalid={Boolean(state.fieldErrors?.password)}
        />
        <FieldError message={state.fieldErrors?.password} locale={locale} />
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <LogIn className="size-4" aria-hidden="true" />}
        {t("auth.submitSignIn")}
      </Button>
    </form>
  );
}
