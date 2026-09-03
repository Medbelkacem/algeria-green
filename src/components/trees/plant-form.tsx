"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import {
  AlertCircle, Camera, CheckCircle2, Crosshair, Loader2, MapPin, Sprout, X,
} from "lucide-react";
import type { Locale } from "@/i18n/config";
import { useTranslator } from "@/i18n/client";
import { localisedName } from "@/lib/display";
import { formatDateShort } from "@/i18n/format";
import { MAX_UPLOAD_MB } from "@/lib/validation/upload";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { submitTreeAction } from "@/server/actions/tree.actions";
import { idleState, type ActionState } from "@/server/action-state";

type Option = { id: number; nameAr: string; nameFr: string; nameEn: string };
type SpeciesOption = Option & { slug: string };
type CampaignOption = { id: string; title: string; date: Date | string };

const NO_CAMPAIGN = "__none__";

export function PlantForm({
  locale,
  species,
  wilayas,
  campaigns,
  defaultWilayaId,
  defaultCampaignId,
}: {
  locale: Locale;
  species: SpeciesOption[];
  wilayas: Option[];
  campaigns: CampaignOption[];
  defaultWilayaId: number | null;
  defaultCampaignId: string | null;
}) {
  const t = useTranslator(locale);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(submitTreeAction, idleState);

  const [speciesId, setSpeciesId] = React.useState<string>("");
  const [coords, setCoords] = React.useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = React.useState(false);
  const [locationError, setLocationError] = React.useState(false);
  const [photoName, setPhotoName] = React.useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  const [online, setOnline] = React.useState(true);
  const photoInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  React.useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const selectedSpecies = species.find((item) => String(item.id) === speciesId);
  const needsCustomSpecies = selectedSpecies?.slug === "other";
  const today = new Date().toISOString().slice(0, 10);

  function requestLocation() {
    if (!("geolocation" in navigator)) {
      setLocationError(true);
      return;
    }
    setLocating(true);
    setLocationError(false);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocationError(true);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  function clearPhoto() {
    if (photoInputRef.current) photoInputRef.current.value = "";
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setPhotoName(null);
  }

  if (state.status === "success" && state.data?.publicId) {
    return (
      <Card>
        <CardContent className="space-y-5 p-6 text-center sm:p-8">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/12 text-success">
            <CheckCircle2 className="size-8" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">{t("plant.successTitle")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("plant.successBody", { id: state.data.publicId })}
            </p>
            <p className="text-sm font-medium text-warning">{t("plant.successPending")}</p>
          </div>
          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <Link href={`/${locale}/dashboard/trees`} className={cn(buttonVariants())}>
              {t("plant.goToTrees")}
            </Link>
            <a href={`/${locale}/plant`} className={cn(buttonVariants({ variant: "outline" }))}>
              {t("plant.another")}
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  const fieldError = (field: string) =>
    state.fieldErrors?.[field] ? t(state.fieldErrors[field], { ...state.values, min: 2, max: 80 }) : undefined;

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="locale" value={locale} />
      {coords ? (
        <>
          <input type="hidden" name="latitude" value={coords.lat} />
          <input type="hidden" name="longitude" value={coords.lng} />
        </>
      ) : null}

      {!online ? (
        <Alert variant="warning">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>{t("errors.offlineTitle")}</AlertTitle>
          <AlertDescription>{t("plant.onlineRequired")}</AlertDescription>
        </Alert>
      ) : null}

      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>{t("errors.title")}</AlertTitle>
          <AlertDescription>{t(state.message ?? "errors.generic", state.values)}</AlertDescription>
        </Alert>
      ) : null}

      <fieldset className="space-y-4 rounded-xl border bg-card p-5 sm:p-6">
        <legend className="px-2 text-sm font-semibold text-primary">{t("plant.sectionWhat")}</legend>

        <div className="space-y-1.5">
          <Label htmlFor="speciesId">{t("tree.species")}</Label>
          <Select name="speciesId" required value={speciesId} onValueChange={setSpeciesId}>
            <SelectTrigger id="speciesId" aria-invalid={Boolean(fieldError("speciesId"))}>
              <SelectValue placeholder={t("tree.species")} />
            </SelectTrigger>
            <SelectContent>
              {species.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  {localisedName(item, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={fieldError("speciesId")} />
        </div>

        {needsCustomSpecies ? (
          <div className="space-y-1.5">
            <Label htmlFor="speciesOther">{t("tree.speciesOther")}</Label>
            <Input id="speciesOther" name="speciesOther" maxLength={80} required />
            <FieldError message={fieldError("speciesOther")} />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="plantingDate">{t("tree.plantingDate")}</Label>
          <Input
            id="plantingDate"
            name="plantingDate"
            type="date"
            required
            max={today}
            defaultValue={today}
            aria-invalid={Boolean(fieldError("plantingDate"))}
          />
          <FieldError message={fieldError("plantingDate")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="campaignId">
            {t("plant.campaignLabel")}
            <span className="text-xs font-normal text-muted-foreground">({t("actions.optional")})</span>
          </Label>
          <Select name="campaignId" defaultValue={defaultCampaignId ?? NO_CAMPAIGN}>
            <SelectTrigger id="campaignId">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CAMPAIGN}>{t("plant.campaignNone")}</SelectItem>
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.title} — {formatDateShort(campaign.date, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{t("plant.campaignHelp")}</p>
          <FieldError message={fieldError("campaignId")} />
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border bg-card p-5 sm:p-6">
        <legend className="px-2 text-sm font-semibold text-primary">{t("plant.sectionWhere")}</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="wilayaId">{t("tree.wilaya")}</Label>
            <Select name="wilayaId" required defaultValue={defaultWilayaId ? String(defaultWilayaId) : undefined}>
              <SelectTrigger id="wilayaId" aria-invalid={Boolean(fieldError("wilayaId"))}>
                <SelectValue placeholder={t("tree.wilaya")} />
              </SelectTrigger>
              <SelectContent>
                {wilayas.map((wilaya) => (
                  <SelectItem key={wilaya.id} value={String(wilaya.id)}>
                    {localisedName(wilaya, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={fieldError("wilayaId")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="commune">{t("tree.commune")}</Label>
            <Input
              id="commune"
              name="commune"
              required
              maxLength={80}
              autoComplete="address-level2"
              aria-invalid={Boolean(fieldError("commune"))}
            />
            <FieldError message={fieldError("commune")} />
          </div>
        </div>

        <div className="space-y-2 rounded-lg bg-muted/40 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" size="sm" onClick={requestLocation} disabled={locating}>
              {locating ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Crosshair className="size-4" aria-hidden="true" />
              )}
              {locating ? t("plant.locating") : t("plant.useMyLocation")}
            </Button>
            {coords ? (
              <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                <MapPin className="size-4" aria-hidden="true" />
                {t("plant.locationCaptured")}
              </span>
            ) : null}
          </div>
          {locationError ? (
            <p role="status" className="text-sm text-warning">
              {t("plant.locationDenied")}
            </p>
          ) : null}
          <p className="text-xs leading-relaxed text-muted-foreground">{t("plant.locationWhy")}</p>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border bg-card p-5 sm:p-6">
        <legend className="px-2 text-sm font-semibold text-primary">{t("plant.sectionProof")}</legend>

        <div className="space-y-2">
          <Label htmlFor="photo">
            {t("tree.photo")}
            <span className="text-xs font-normal text-muted-foreground">({t("actions.optional")})</span>
          </Label>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={() => photoInputRef.current?.click()}>
              <Camera className="size-4" aria-hidden="true" />
              {t("actions.upload")}
            </Button>
            {photoName ? (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="max-w-[12rem] truncate">{photoName}</span>
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="rounded-md p-1 hover:text-foreground"
                  aria-label={t("actions.remove")}
                >
                  <X className="size-4" />
                </button>
              </span>
            ) : null}
          </div>
          <input
            ref={photoInputRef}
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (photoPreview) URL.revokeObjectURL(photoPreview);
              setPhotoName(file ? file.name : null);
              setPhotoPreview(file ? URL.createObjectURL(file) : null);
            }}
          />
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoPreview}
              alt=""
              className="mt-2 h-40 w-full rounded-lg border object-cover sm:w-64"
            />
          ) : null}
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("plant.photoWhy", { size: MAX_UPLOAD_MB })}
          </p>
          <FieldError message={fieldError("photo")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">
            {t("tree.notes")}
            <span className="text-xs font-normal text-muted-foreground">({t("actions.optional")})</span>
          </Label>
          <Textarea id="notes" name="notes" maxLength={1000} placeholder={t("plant.notesPlaceholder")} />
          <FieldError message={fieldError("notes")} />
        </div>

        <div className="flex items-start gap-3 rounded-lg bg-muted/40 p-4">
          <Checkbox id="anonymous" name="anonymous" className="mt-0.5" />
          <Label htmlFor="anonymous" className="text-sm font-normal leading-relaxed">
            {t("plant.anonymousLabel")}
          </Label>
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" disabled={pending || !online} className="sm:w-auto">
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sprout className="size-4" aria-hidden="true" />
          )}
          {pending ? t("plant.submitting") : t("plant.submit")}
        </Button>
        <p className="text-xs text-muted-foreground">{t("misc.notCountedYet")}</p>
      </div>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}
