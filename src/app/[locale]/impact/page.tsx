import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BarChart3, MapPin, TentTree, TreePine, Users } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { formatMonth, formatNumber } from "@/i18n/format";
import { localisedName } from "@/lib/display";
import {
  getCampaignActivity, getPlantingSourceSplit, getPublicStats, getVerifiedTreesByMonth,
  getVerifiedTreesByWilaya,
} from "@/services/analytics.service";
import { prisma } from "@/lib/db/prisma";
import { Container, PageHeader } from "@/components/shared/section";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  CampaignActivityChart, SourceSplitChart, TreesOverTimeChart, WilayaBarChart,
} from "@/components/impact/charts";

export const revalidate = 120;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = createTranslator(locale);
  return { title: t("impact.title"), description: t("impact.subtitle") };
}

export default async function ImpactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = createTranslator(locale);

  const [stats, monthly, byWilaya, split, activity, wilayas] = await Promise.all([
    getPublicStats(),
    getVerifiedTreesByMonth(),
    getVerifiedTreesByWilaya(),
    getPlantingSourceSplit(),
    getCampaignActivity(),
    prisma.wilaya.findMany(),
  ]);

  const wilayaNames = new Map(wilayas.map((w) => [w.id, localisedName(w, locale)]));

  // Charts are rendered only when the database actually holds matching rows.
  const timeSeries = monthly.map((point) => ({
    label: formatMonth(point.month, locale),
    count: point.count,
    cumulative: point.cumulative,
  }));
  const wilayaSeries = byWilaya
    .slice(0, 12)
    .map((row) => ({ label: wilayaNames.get(row.wilayaId) ?? String(row.wilayaId), value: row.verifiedTrees }));
  const splitSeries =
    split.individual + split.campaign > 0
      ? [
          { label: t("impact.individual"), value: split.individual },
          { label: t("impact.viaCampaign"), value: split.campaign },
        ]
      : [];
  const activitySeries = activity.map((row) => ({
    label: t(`campaignStatus.${row.status}`),
    value: row.count,
  }));

  return (
    <Container className="py-8 sm:py-12">
      <PageHeader title={t("impact.title")} description={t("impact.subtitle")} />

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          value={formatNumber(stats.verifiedTrees, locale)}
          label={t("stats.verifiedTrees")}
          icon={<TreePine />}
          tone="primary"
        />
        <StatCard value={formatNumber(stats.campaigns, locale)} label={t("stats.campaigns")} icon={<TentTree />} />
        <StatCard value={formatNumber(stats.participants, locale)} label={t("stats.participants")} icon={<Users />} />
        <StatCard
          value={formatNumber(stats.wilayasCovered, locale)}
          label={t("stats.wilayasCovered")}
          icon={<MapPin />}
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("impact.overTime")}</CardTitle>
          </CardHeader>
          <CardContent>
            {timeSeries.length === 0 ? (
              <EmptyState icon={<BarChart3 />} title={t("impact.noData")} />
            ) : (
              <TreesOverTimeChart
                data={timeSeries}
                monthlyLabel={t("impact.monthly")}
                cumulativeLabel={t("impact.cumulative")}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("impact.byWilaya")}</CardTitle>
          </CardHeader>
          <CardContent>
            {wilayaSeries.length === 0 ? (
              <EmptyState icon={<MapPin />} title={t("impact.noData")} />
            ) : (
              <WilayaBarChart data={wilayaSeries} label={t("stats.verifiedTrees")} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("impact.campaignVsIndividual")}</CardTitle>
          </CardHeader>
          <CardContent>
            {splitSeries.length === 0 ? (
              <EmptyState icon={<TreePine />} title={t("impact.noData")} />
            ) : (
              <SourceSplitChart data={splitSeries} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("impact.campaignActivity")}</CardTitle>
          </CardHeader>
          <CardContent>
            {activitySeries.length === 0 ? (
              <EmptyState icon={<TentTree />} title={t("impact.noData")} />
            ) : (
              <CampaignActivityChart data={activitySeries} label={t("stats.campaigns")} />
            )}
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">{t("misc.verifiedOnly")}</p>
    </Container>
  );
}
