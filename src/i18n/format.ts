import { LOCALE_META, type Locale } from "./config";

export function formatNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(LOCALE_META[locale].intl).format(value);
}

export function formatDate(value: Date | string, locale: Locale, options?: Intl.DateTimeFormatOptions) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(LOCALE_META[locale].intl, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
    ...options,
  }).format(date);
}

export function formatDateShort(value: Date | string, locale: Locale) {
  return formatDate(value, locale, { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(value: Date | string, locale: Locale) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(LOCALE_META[locale].intl, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatMonth(iso: string, locale: Locale) {
  const [year, month] = iso.split("-").map(Number);
  if (!year || !month) return iso;
  return new Intl.DateTimeFormat(LOCALE_META[locale].intl, {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function formatPercent(value: number, locale: Locale) {
  return new Intl.NumberFormat(LOCALE_META[locale].intl, {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value / 100);
}
