import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: createTranslator(locale)("auth.signInTitle"), robots: { index: false } };
}

export default async function SignInPage({
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

  const user = await getCurrentUser();
  if (user) redirect(`/${locale}/dashboard`);

  const query = await searchParams;
  const requested = Array.isArray(query.redirectTo) ? query.redirectTo[0] : query.redirectTo;
  // Relative same-origin targets only — this is the open-redirect guard.
  const redirectTo = requested && requested.startsWith("/") && !requested.startsWith("//") ? requested : undefined;

  return (
    <AuthShell
      locale={locale}
      brand={t("brand.name")}
      title={t("auth.signInTitle")}
      subtitle={t("auth.signInSubtitle")}
      footer={
        <>
          <Link href={`/${locale}/forgot-password`} className="font-medium text-primary hover:underline">
            {t("auth.forgotPassword")}
          </Link>
          <span className="mx-2 text-border">·</span>
          {t("auth.noAccount")}{" "}
          <Link href={`/${locale}/sign-up`} className="font-medium text-primary hover:underline">
            {t("nav.signUp")}
          </Link>
        </>
      }
    >
      <SignInForm locale={locale} redirectTo={redirectTo} />
    </AuthShell>
  );
}
