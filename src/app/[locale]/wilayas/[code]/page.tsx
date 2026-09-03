import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Sprout, TentTree, TreePine, Users } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { formatDateShort, formatNumber } from "@/i18n/format";
import { localisedName, speciesLabel } from "@/lib/display";
import { getWilayaDetail } from "@/services/wilaya.service";
import { Container, PageHeader, SectionHeading } from "@/components/shared/section";
import { StatCard } from "@/components/shared/stat-card";
import { CampaignStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}): Promise<Metadata> {
  const { locale, code } = await params;
  if (!isLocale(locale)) return {};
  const detail = await getWilayaDetail(code);
  if (!detail) return {};
  const t = createTranslator(locale);
  return {
    title: `${localisedName(detail.wilaya, locale)} — ${t("wilayas.title")}`,
    description: t("wilayas.subtitle"),
  };
}

export default async function WilayaDetailPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale: raw, code } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = createTranslator(locale);

  const detail = await getWilayaDetail(code);
  if (!detail) notFound();

  const name = localisedName(detail.wilaya, locale);

  return (
    <Container className="py-8 sm:py-12">
      <PageHeader
        title={name}
        description={`${t("wilayas.code")} ${detail.wilaya.code}`}
      />

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard
          value={formatNumber(detail.stats.verifiedTrees, locale)}
          label={t("wilayas.trees")}
          icon={<TreePine />}
          tone="primary"
        />
        <StatCard
          value={formatNumber(detail.stats.campaigns, locale)}
          label={t("wilayas.campaigns")}
          icon={<TentTree />}
        />
        <StatCard
          value={formatNumber(detail.stats.participants, locale)}
          label={t("wilayas.participants")}
          icon={<Users />}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <section className="mt-12">
        <SectionHeading title={t("nav.campaigns")} />
        <div className="mt-4">
          {detail.recentCampaigns.length === 0 ? (
            <EmptyState icon={<TentTree />} title={t("empty.campaigns")} description={t("empty.campaignsHint")} />
          ) : (
            <ul className="divide-y rounded-xl border bg-card">
              {detail.recentCampaigns.map((campaign) => (
                <li key={campaign.id}>
                  <Link
                    href={`/${locale}/campaigns/${campaign.slug}`}
                    className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{campaign.title}</p>
                      <p className="tabular mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="size-3.5" aria-hidden="true" />
                        {campaign.commune} · {formatDateShort(campaign.date, locale)}
                      </p>
                    </div>
                    <CampaignStatusBadge status={campaign.status} t={t} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-12">
        <SectionHeading title={t("wilayas.recentActivity")} />
        <div className="mt-4">
          {detail.recentTrees.length === 0 ? (
            <EmptyState icon={<Sprout />} title={t("empty.trees")} description={t("empty.treesHint")} />
          ) : (
            <ul className="divide-y rounded-xl border bg-card">
              {detail.recentTrees.map((tree) => (
                <li key={tree.publicId}>
                  <Link
                    href={`/${locale}/tree/${tree.publicId}`}
                    className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {speciesLabel(tree.species, tree.speciesOther, locale)}
                      </p>
                      <p className="tabular mt-0.5 text-xs text-muted-foreground">
                        {tree.commune} · {formatDateShort(tree.plantingDate, locale)}
                      </p>
                    </div>
                    <Badge variant="muted" className="font-mono text-[10px]">
                      {tree.publicId}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </Container>
  );
}
