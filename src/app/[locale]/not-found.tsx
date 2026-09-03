import Link from "next/link";
import { headers } from "next/headers";
import { FileQuestion } from "lucide-react";
import { DEFAULT_LOCALE, resolveLocale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Rendered for any unmatched path inside a locale segment. Route params are
 * not available here, so the language comes from the header the locale proxy
 * sets on every request.
 */
export default async function LocaleNotFound() {
  let locale = DEFAULT_LOCALE;
  try {
    const headerList = await headers();
    locale = resolveLocale(headerList.get("x-dzg-locale"));
  } catch {
    // Static rendering: fall back to the default language.
  }
  const t = createTranslator(locale);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary">
        <FileQuestion className="size-8" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("errors.notFoundTitle")}</h1>
      <p className="text-muted-foreground">{t("errors.notFoundBody")}</p>
      <Link href={`/${locale}`} className={cn(buttonVariants())}>
        {t("errors.goHome")}
      </Link>
    </div>
  );
}
