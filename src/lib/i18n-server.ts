import "server-only";
import { cache } from "react";
import { createTranslator, type Translator } from "@/i18n/messages";
import { resolveLocale, type Locale } from "@/i18n/config";

export const getTranslator = cache((locale: string): Translator => createTranslator(resolveLocale(locale)));

export function localeFromParams(params: { locale: string }): Locale {
  return resolveLocale(params.locale);
}
