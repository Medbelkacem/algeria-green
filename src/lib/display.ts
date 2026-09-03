import type { Locale } from "@/i18n/config";

type Localised = { nameAr: string; nameFr: string; nameEn: string };

export function localisedName(entity: Localised | null | undefined, locale: Locale): string {
  if (!entity) return "";
  return locale === "ar" ? entity.nameAr : locale === "fr" ? entity.nameFr : entity.nameEn;
}

export function speciesLabel(
  species: (Localised & { slug: string }) | null | undefined,
  speciesOther: string | null | undefined,
  locale: Locale,
): string {
  if (!species) return speciesOther ?? "";
  if (species.slug === "other" && speciesOther) return speciesOther;
  return localisedName(species, locale);
}
