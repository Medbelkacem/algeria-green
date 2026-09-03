export const LOCALES = ["ar", "fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_COOKIE = "dzg_locale";

export const LOCALE_META: Record<Locale, { label: string; dir: "rtl" | "ltr"; htmlLang: string; intl: string }> = {
  ar: { label: "العربية", dir: "rtl", htmlLang: "ar-DZ", intl: "ar-DZ" },
  fr: { label: "Français", dir: "ltr", htmlLang: "fr-DZ", intl: "fr-DZ" },
  en: { label: "English", dir: "ltr", htmlLang: "en", intl: "en-GB" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function dirOf(locale: Locale) {
  return LOCALE_META[locale].dir;
}
