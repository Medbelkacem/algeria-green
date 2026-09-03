"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { KeyRound, Loader2, Save } from "lucide-react";
import { LOCALES, LOCALE_META, type Locale } from "@/i18n/config";
import { rememberLocale, useTranslator } from "@/i18n/client";
import { localisedName } from "@/lib/display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  changePasswordAction, resendVerificationAction, updateProfileAction,
} from "@/server/actions/auth.actions";
import { idleState, type ActionState } from "@/server/action-state";
import { FieldError, FormMessage } from "@/components/auth/form-message";

type WilayaOption = { id: number; code: string; nameAr: string; nameFr: string; nameEn: string };

const NO_WILAYA = "__none__";

export function ProfileForm({
  locale,
  wilayas,
  defaults,
}: {
  locale: Locale;
  wilayas: WilayaOption[];
  defaults: { name: string; wilayaId: number | null; locale: string; publicProfile: boolean };
}) {
  const t = useTranslator(locale);
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateProfileAction, idleState);
  const [publicProfile, setPublicProfile] = React.useState(defaults.publicProfile);
  const [selectedLocale, setSelectedLocale] = React.useState(defaults.locale);

  React.useEffect(() => {
    if (state.status === "success" && state.data?.locale && state.data.locale !== locale) {
      // Interface language changed: move the user to the matching URL.
      rememberLocale(state.data.locale as Locale);
      router.push(`/${state.data.locale}/dashboard/settings`);
      router.refresh();
    }
  }, [state, locale, router]);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="publicProfile" value={publicProfile ? "true" : "false"} />
      <FormMessage state={state} locale={locale} />

      <div className="space-y-1.5">
        <Label htmlFor="settings-name">{t("auth.name")}</Label>
        <Input id="settings-name" name="name" defaultValue={defaults.name} required minLength={2} maxLength={80} />
        <FieldError message={state.fieldErrors?.name} locale={locale} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="settings-wilaya">{t("auth.wilayaOptional")}</Label>
        <Select name="wilayaId" defaultValue={defaults.wilayaId ? String(defaults.wilayaId) : NO_WILAYA}>
          <SelectTrigger id="settings-wilaya">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_WILAYA}>{t("misc.unknown")}</SelectItem>
            {wilayas.map((wilaya) => (
              <SelectItem key={wilaya.id} value={String(wilaya.id)}>
                {wilaya.code} · {localisedName(wilaya, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="settings-locale">{t("profile.language")}</Label>
        <Select name="locale" value={selectedLocale} onValueChange={setSelectedLocale}>
          <SelectTrigger id="settings-locale">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOCALES.map((code) => (
              <SelectItem key={code} value={code}>
                {LOCALE_META[code].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
        <div className="min-w-0 space-y-1">
          <Label htmlFor="settings-public" className="font-medium">
            {t("profile.publicProfile")}
          </Label>
          <p className="text-xs leading-relaxed text-muted-foreground">{t("profile.publicProfileHelp")}</p>
        </div>
        <Switch id="settings-public" checked={publicProfile} onCheckedChange={setPublicProfile} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
        {pending ? t("actions.saving") : t("actions.save")}
      </Button>
    </form>
  );
}

export function PasswordForm({ locale }: { locale: Locale }) {
  const t = useTranslator(locale);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(changePasswordAction, idleState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormMessage state={state} locale={locale} />

      <div className="space-y-1.5">
        <Label htmlFor="currentPassword">{t("profile.currentPassword")}</Label>
        <Input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" />
        <FieldError message={state.fieldErrors?.currentPassword} locale={locale} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="newPassword">{t("profile.newPassword")}</Label>
        <Input id="newPassword" name="password" type="password" required autoComplete="new-password" minLength={8}
          aria-describedby="new-password-help" />
        <p id="new-password-help" className="text-xs text-muted-foreground">{t("auth.passwordHelp")}</p>
        <FieldError message={state.fieldErrors?.password} locale={locale} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmNewPassword">{t("auth.confirmPassword")}</Label>
        <Input id="confirmNewPassword" name="confirmPassword" type="password" required autoComplete="new-password" />
        <FieldError message={state.fieldErrors?.confirmPassword} locale={locale} />
      </div>

      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <KeyRound className="size-4" aria-hidden="true" />}
        {t("profile.changePassword")}
      </Button>
    </form>
  );
}

export function ResendVerificationButton({ locale }: { locale: Locale }) {
  const t = useTranslator(locale);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    resendVerificationAction,
    idleState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <FormMessage state={state} locale={locale} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        {t("auth.verifyResend")}
      </Button>
    </form>
  );
}
