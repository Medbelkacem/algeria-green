import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: createTranslator(locale)("auth.signUpTitle"), robots: { index: false } };
}

export default async function SignUpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = createTranslator(locale);

  const user = await getCurrentUser();
  if (user) redirect(`/${locale}/dashboard`);

  const wilayas = await prisma.wilaya.findMany({ orderBy: { id: "asc" } });

  return (
    <AuthShell
      locale={locale}
      brand={t("brand.name")}
      title={t("auth.signUpTitle")}
      subtitle={t("auth.signUpSubtitle")}
      footer={
        <>
          {t("auth.hasAccount")}{" "}
          <Link href={`/${locale}/sign-in`} className="font-medium text-primary hover:underline">
            {t("nav.signIn")}
          </Link>
        </>
      }
    >
      <SignUpForm locale={locale} wilayas={wilayas} />
    </AuthShell>
  );
}
