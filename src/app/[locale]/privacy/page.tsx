import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { Container, PageHeader } from "@/components/shared/section";
import { LegalBody } from "@/components/shared/legal-body";
import { PRIVACY_SECTIONS } from "@/content/legal";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: createTranslator(locale)("legal.privacyTitle") };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = createTranslator(locale);

  return (
    <Container className="max-w-3xl py-12">
      <PageHeader title={t("legal.privacyTitle")} />
      <LegalBody sections={PRIVACY_SECTIONS} locale={locale} />
    </Container>
  );
}
