"use client";

import { useActionState } from "react";
import { Loader2, Mail, KeyRound } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { useTranslator } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction, resetPasswordAction } from "@/server/actions/auth.actions";
import { idleState, type ActionState } from "@/server/action-state";
import { FieldError, FormMessage } from "./form-message";

export function ForgotPasswordForm({ locale }: { locale: Locale }) {
  const t = useTranslator(locale);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(forgotPasswordAction, idleState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormMessage state={state} locale={locale} />
      <div className="space-y-1.5">
        <Label htmlFor="email">{t("auth.email")}</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" dir="ltr"
          aria-invalid={Boolean(state.fieldErrors?.email)} />
        <FieldError message={state.fieldErrors?.email} locale={locale} />
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Mail className="size-4" aria-hidden="true" />}
        {t("auth.forgotSubmit")}
      </Button>
    </form>
  );
}

export function ResetPasswordForm({ locale, token }: { locale: Locale; token: string }) {
  const t = useTranslator(locale);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(resetPasswordAction, idleState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <FormMessage state={state} locale={locale} />
      <div className="space-y-1.5">
        <Label htmlFor="password">{t("auth.password")}</Label>
        <Input id="password" name="password" type="password" required autoComplete="new-password" minLength={8}
          aria-describedby="reset-help" aria-invalid={Boolean(state.fieldErrors?.password)} />
        <p id="reset-help" className="text-xs text-muted-foreground">{t("auth.passwordHelp")}</p>
        <FieldError message={state.fieldErrors?.password} locale={locale} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password"
          aria-invalid={Boolean(state.fieldErrors?.confirmPassword)} />
        <FieldError message={state.fieldErrors?.confirmPassword} locale={locale} />
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={pending || state.status === "success"}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <KeyRound className="size-4" aria-hidden="true" />}
        {t("auth.resetSubmit")}
      </Button>
    </form>
  );
}
