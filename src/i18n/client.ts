"use client";

import { useMemo } from "react";
import { createTranslator, type Translator } from "./messages";
import { LOCALE_COOKIE, type Locale } from "./config";

/**
 * Client components build their own translator from the active locale.
 * A function cannot cross the server/client boundary, so the locale string
 * is what gets passed down, never the translator itself.
 */
export function useTranslator(locale: Locale): Translator {
  return useMemo(() => createTranslator(locale), [locale]);
}

/**
 * Persists the reader's language choice so a later visit to `/` lands on the
 * right locale. Kept out of components: writing `document.cookie` inline is a
 * side effect the React compiler (rightly) refuses inside render scope.
 */
export function rememberLocale(locale: Locale) {
  try {
    document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
  } catch {
    // Cookies can be blocked; language still applies for this navigation.
  }
}
