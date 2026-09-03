import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/password-forms";
import { Alert, AlertDescription } from "@/components/ui/alert";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: createTranslator(locale)("auth.resetTitle"), robots: { index: false } };
}

export default async function ResetPasswordPage({
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

  return (
    <AuthShell
      locale={locale}
      brand={t("brand.name")}
      title={t("auth.resetTitle")}
      footer={
        <Link href={`/${locale}/sign-in`} className="font-medium text-primary hover:underline">
          {t("nav.signIn")}
        </Link>
      }
    >
      {token ? (
        <ResetPasswordForm locale={locale} token={token} />
      ) : (
        <Alert variant="destructive">
          <AlertDescription className="text-foreground">{t("auth.resetInvalid")}</AlertDescription>
        </Alert>
      )}
    </AuthShell>
  );
}
