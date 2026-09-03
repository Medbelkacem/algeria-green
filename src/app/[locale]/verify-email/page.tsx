import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { cn } from "@/lib/utils";
import { verifyEmailToken } from "@/services/auth.service";
import { AuthShell } from "@/components/auth/auth-shell";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: createTranslator(locale)("auth.verifyTitle"), robots: { index: false } };
}

export default async function VerifyEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = createTranslator(locale);

  const query = await searchParams;
  const token = Array.isArray(query.token) ? query.token[0] : query.token;
  const verified = token ? await verifyEmailToken(token) : false;

  return (
    <AuthShell locale={locale} brand={t("brand.name")} title={t("auth.verifyTitle")}>
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className={cn(
            "flex size-14 items-center justify-center rounded-full",
            verified ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive",
          )}
        >
          {verified ? <CheckCircle2 className="size-7" aria-hidden="true" /> : <XCircle className="size-7" aria-hidden="true" />}
        </div>
        <p className="text-sm text-muted-foreground">
          {verified ? t("auth.verifyDone") : t("auth.verifyInvalid")}
        </p>
        <Link href={`/${locale}/dashboard`} className={cn(buttonVariants())}>
          {t("nav.dashboard")}
        </Link>
      </div>
    </AuthShell>
  );
}
