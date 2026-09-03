"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import type { Locale } from "@/i18n/config";
import { useTranslator } from "@/i18n/client";
import { localisedName } from "@/lib/display";
import { MAX_UPLOAD_MB } from "@/lib/validation/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createCampaignAction, updateCampaignAction } from "@/server/actions/campaign.actions";
import { idleState, type ActionState } from "@/server/action-state";
import { FieldError, FormMessage } from "@/components/auth/form-message";

type WilayaOption = { id: number; code: string; nameAr: string; nameFr: string; nameEn: string };

export type CampaignDefaults = {
  id?: string;
  title: string;
  description: string;
  coverImageUrl: string;
  wilayaId: string;
  commune: string;
  locationLabel: string;
  latitude: string;
  longitude: string;
  date: string;
  startTime: string;
  endTime: string;
  targetTrees: string;
  maxParticipants: string;
  organizerName: string;
  status: string;
};

const STATUSES = ["DRAFT", "UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"] as const;

export function CampaignForm({
  locale,
  wilayas,
  defaults,
  mode,
}: {
  locale: Locale;
  wilayas: WilayaOption[];
  defaults: CampaignDefaults;
  mode: "create" | "edit";
}) {
  const t = useTranslator(locale);
  const action = mode === "create" ? createCampaignAction : updateCampaignAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, idleState);
  const [coverName, setCoverName] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (state.status === "success") toast.success(t(state.message ?? "admin.campaignUpdated"));
  }, [state, t]);

  const err = (field: string) => state.fieldErrors?.[field];

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="locale" value={locale} />
      {defaults.id ? <input type="hidden" name="campaignId" value={defaults.id} /> : null}
      <input type="hidden" name="coverImageUrl" value={defaults.coverImageUrl} />

      <FormMessage state={state} locale={locale} />

      <fieldset className="space-y-4 rounded-xl border bg-card p-5">
        <legend className="px-2 text-sm font-semibold text-primary">{t("campaign.title")}</legend>

        <div className="space-y-1.5">
          <Label htmlFor="title">{t("campaign.title")}</Label>
          <Input id="title" name="title" required minLength={4} maxLength={140} defaultValue={defaults.title}
            aria-invalid={Boolean(err("title"))} />
          <FieldError message={err("title")} locale={locale} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">{t("campaign.description")}</Label>
          <Textarea id="description" name="description" required minLength={20} maxLength={5000} rows={6}
            defaultValue={defaults.description} aria-invalid={Boolean(err("description"))} />
          <FieldError message={err("description")} locale={locale} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cover">{t("campaign.cover")}</Label>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" size="sm" asChild>
              <label htmlFor="cover" className="cursor-pointer">
                <Upload className="size-4" aria-hidden="true" />
                {t("actions.upload")}
              </label>
            </Button>
            {coverName ? <span className="max-w-48 truncate text-sm text-muted-foreground">{coverName}</span> : null}
            {defaults.coverImageUrl && !coverName ? (
              <span className="max-w-64 truncate text-xs text-muted-foreground" dir="ltr">
                {defaults.coverImageUrl}
              </span>
            ) : null}
          </div>
          <input
            id="cover"
            name="cover"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => setCoverName(event.target.files?.[0]?.name ?? null)}
          />
          <p className="text-xs text-muted-foreground">{t("plant.photoWhy", { size: MAX_UPLOAD_MB })}</p>
          <FieldError message={err("cover")} locale={locale} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="organizerName">{t("campaign.organizer")}</Label>
          <Input id="organizerName" name="organizerName" required minLength={2} maxLength={120}
            defaultValue={defaults.organizerName} aria-invalid={Boolean(err("organizerName"))} />
          <FieldError message={err("organizerName")} locale={locale} />
        </div>
      </fieldset>

      <fieldset className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2">
        <legend className="px-2 text-sm font-semibold text-primary">{t("campaign.location")}</legend>

        <div className="space-y-1.5">
          <Label htmlFor="wilayaId">{t("campaign.wilaya")}</Label>
          <Select name="wilayaId" required defaultValue={defaults.wilayaId || undefined}>
            <SelectTrigger id="wilayaId" aria-invalid={Boolean(err("wilayaId"))}>
              <SelectValue placeholder={t("campaign.wilaya")} />
            </SelectTrigger>
            <SelectContent>
              {wilayas.map((wilaya) => (
                <SelectItem key={wilaya.id} value={String(wilaya.id)}>
                  {wilaya.code} · {localisedName(wilaya, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={err("wilayaId")} locale={locale} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="commune">{t("campaign.commune")}</Label>
          <Input id="commune" name="commune" required maxLength={80} defaultValue={defaults.commune}
            aria-invalid={Boolean(err("commune"))} />
          <FieldError message={err("commune")} locale={locale} />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="locationLabel">
            {t("campaign.location")}
            <span className="text-xs font-normal text-muted-foreground">({t("actions.optional")})</span>
          </Label>
          <Input id="locationLabel" name="locationLabel" maxLength={160} defaultValue={defaults.locationLabel} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="latitude">
            {t("tree.coordinates")} — lat
            <span className="text-xs font-normal text-muted-foreground">({t("actions.optional")})</span>
          </Label>
          <Input id="latitude" name="latitude" type="number" step="any" dir="ltr" defaultValue={defaults.latitude}
            aria-invalid={Boolean(err("latitude"))} />
          <FieldError message={err("latitude")} locale={locale} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="longitude">
            {t("tree.coordinates")} — lng
            <span className="text-xs font-normal text-muted-foreground">({t("actions.optional")})</span>
          </Label>
          <Input id="longitude" name="longitude" type="number" step="any" dir="ltr" defaultValue={defaults.longitude} />
        </div>
      </fieldset>

      <fieldset className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="px-2 text-sm font-semibold text-primary">{t("campaign.date")}</legend>

        <div className="space-y-1.5">
          <Label htmlFor="date">{t("campaign.date")}</Label>
          <Input id="date" name="date" type="date" required defaultValue={defaults.date}
            aria-invalid={Boolean(err("date"))} />
          <FieldError message={err("date")} locale={locale} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="startTime">{t("campaign.startTime")}</Label>
          <Input id="startTime" name="startTime" type="time" defaultValue={defaults.startTime} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="endTime">{t("campaign.endTime")}</Label>
          <Input id="endTime" name="endTime" type="time" defaultValue={defaults.endTime}
            aria-invalid={Boolean(err("endTime"))} />
          <FieldError message={err("endTime")} locale={locale} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="targetTrees">{t("campaign.targetTrees")}</Label>
          <Input id="targetTrees" name="targetTrees" type="number" min={1} required dir="ltr"
            defaultValue={defaults.targetTrees} aria-invalid={Boolean(err("targetTrees"))} />
          <FieldError message={err("targetTrees")} locale={locale} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="maxParticipants">
            {t("campaign.maxParticipants")}
            <span className="text-xs font-normal text-muted-foreground">({t("actions.optional")})</span>
          </Label>
          <Input id="maxParticipants" name="maxParticipants" type="number" min={1} dir="ltr"
            defaultValue={defaults.maxParticipants} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status">{t("campaign.status")}</Label>
          <Select name="status" required defaultValue={defaults.status}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`campaignStatus.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </fieldset>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
        {pending ? t("actions.saving") : mode === "create" ? t("actions.create") : t("actions.save")}
      </Button>
    </form>
  );
}
