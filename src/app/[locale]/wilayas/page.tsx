import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { formatNumber } from "@/i18n/format";
import { localisedName } from "@/lib/display";
import { listWilayaStats } from "@/services/wilaya.service";
import { Container, PageHeader } from "@/components/shared/section";
import { WilayaSearch } from "@/components/wilayas/wilaya-search";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = createTranslator(locale);
  return { title: t("wilayas.title"), description: t("wilayas.subtitle") };
}

export default async function WilayasPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = createTranslator(locale);

  const wilayas = await listWilayaStats();

  const items = wilayas.map((wilaya) => ({
    code: wilaya.code,
    name: localisedName(wilaya, locale),
    href: `/${locale}/wilayas/${wilaya.code}`,
    trees: formatNumber(wilaya.verifiedTrees, locale),
    campaigns: formatNumber(wilaya.campaigns, locale),
    hasActivity: wilaya.verifiedTrees > 0 || wilaya.campaigns > 0,
  }));

  return (
    <Container className="py-8 sm:py-12">
      <PageHeader title={t("wilayas.title")} description={t("wilayas.subtitle")} />
      <div className="mt-6">
        <WilayaSearch
          items={items}
          labels={{
            search: t("actions.search"),
            placeholder: t("wilayas.searchPlaceholder"),
            trees: t("wilayas.trees"),
            campaigns: t("wilayas.campaigns"),
            empty: t("empty.results"),
            emptyHint: t("empty.resultsHint"),
          }}
        />
      </div>
    </Container>
  );
}
