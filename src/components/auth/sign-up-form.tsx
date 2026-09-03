"use client";

import { useActionState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { useTranslator } from "@/i18n/client";
import { localisedName } from "@/lib/display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { signUpAction } from "@/server/actions/auth.actions";
import { idleState, type ActionState } from "@/server/action-state";
import { FieldError, FormMessage } from "./form-message";

type WilayaOption = { id: number; code: string; nameAr: string; nameFr: string; nameEn: string };

export function SignUpForm({
  locale,
  wilayas,
}: {
  locale: Locale;
  wilayas: WilayaOption[];
}) {
  const t = useTranslator(locale);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(signUpAction, idleState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="locale" value={locale} />

      <FormMessage state={state} locale={locale} />

      <div className="space-y-1.5">
        <Label htmlFor="name">{t("auth.name")}</Label>
        <Input id="name" name="name" required autoComplete="name" minLength={2} maxLength={80}
          aria-invalid={Boolean(state.fieldErrors?.name)} />
        <FieldError message={state.fieldErrors?.name} locale={locale} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">{t("auth.email")}</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" dir="ltr"
          aria-invalid={Boolean(state.fieldErrors?.email)} />
        <FieldError message={state.fieldErrors?.email} locale={locale} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="wilayaId">{t("auth.wilayaOptional")}</Label>
        <Select name="wilayaId">
          <SelectTrigger id="wilayaId">
            <SelectValue placeholder={t("auth.wilaya")} />
          </SelectTrigger>
          <SelectContent>
            {wilayas.map((wilaya) => (
              <SelectItem key={wilaya.id} value={String(wilaya.id)}>
                {wilaya.code} · {localisedName(wilaya, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">{t("auth.password")}</Label>
        <Input id="password" name="password" type="password" required autoComplete="new-password" minLength={8}
          aria-describedby="password-help" aria-invalid={Boolean(state.fieldErrors?.password)} />
        <p id="password-help" className="text-xs text-muted-foreground">{t("auth.passwordHelp")}</p>
        <FieldError message={state.fieldErrors?.password} locale={locale} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password"
          aria-invalid={Boolean(state.fieldErrors?.confirmPassword)} />
        <FieldError message={state.fieldErrors?.confirmPassword} locale={locale} />
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <UserPlus className="size-4" aria-hidden="true" />}
        {t("auth.submitSignUp")}
      </Button>
    </form>
  );
}
