import Link from "next/link";
import {
  ArrowLeft, ArrowRight, BadgeCheck, BarChart3, CalendarCheck, Leaf, MapPin, Search,
  ShieldCheck, Sprout, TentTree, TreePine, Users,
} from "lucide-react";
import type { Metadata } from "next";
import { LOCALE_META, isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { formatNumber } from "@/i18n/format";
import { localisedName } from "@/lib/display";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Container, SectionHeading } from "@/components/shared/section";
import { StatCard } from "@/components/shared/stat-card";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { VerifiedTreeCard } from "@/components/trees/tree-card";
import { getPublicStats } from "@/services/analytics.service";
import { listHomeCampaigns } from "@/services/campaign.service";
import { listRecentVerifiedTrees } from "@/services/tree.service";
import { listWilayaStats } from "@/services/wilaya.service";
import { notFound } from "next/navigation";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = createTranslator(locale);
  return { title: `${t("brand.name")} — ${t("brand.slogan")}`, description: t("brand.description") };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = createTranslator(locale);
  const dir = LOCALE_META[locale].dir;
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  // Every number below is read from PostgreSQL. An empty database renders 0.
  const [stats, campaigns, recentTrees, wilayaStats] = await Promise.all([
    getPublicStats(),
    listHomeCampaigns(3),
    listRecentVerifiedTrees(4),
    listWilayaStats(),
  ]);

  const coveredWilayas = wilayaStats
    .filter((w) => w.verifiedTrees > 0 || w.campaigns > 0)
    .sort((a, b) => b.verifiedTrees - a.verifiedTrees)
    .slice(0, 12);

  const steps = [
    { icon: Search, title: t("home.step1Title"), body: t("home.step1Body") },
    { icon: Users, title: t("home.step2Title"), body: t("home.step2Body") },
    { icon: Sprout, title: t("home.step3Title"), body: t("home.step3Body") },
    { icon: ShieldCheck, title: t("home.step4Title"), body: t("home.step4Body") },
    { icon: BarChart3, title: t("home.step5Title"), body: t("home.step5Body") },
  ];

  return (
    <>
      <section className="bg-hero relative overflow-hidden border-b">
        <div className="bg-grid absolute inset-0 opacity-[0.35]" aria-hidden="true" />
        <Container className="relative py-16 sm:py-24 lg:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
              <Leaf className="size-3.5" aria-hidden="true" />
              {t("home.heroBadge")}
            </span>

            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              {t("home.heroTitle")}
            </h1>
            <p className="mt-3 text-base font-medium text-primary sm:text-lg">{t("brand.slogan")}</p>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("home.heroSubtitle")}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={`/${locale}/plant`} className={cn(buttonVariants({ size: "lg" }))}>
                {t("home.ctaPlant")}
              </Link>
              <Link
                href={`/${locale}/campaigns`}
                className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
              >
                {t("home.ctaCampaigns")}
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <SectionHeading title={t("home.statsTitle")} description={t("home.statsSubtitle")} />
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
        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <BadgeCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />
          {t("misc.verifiedOnly")}
        </p>
      </Container>

      <section className="border-y bg-muted/25">
        <Container className="py-12 sm:py-16">
          <SectionHeading title={t("home.howTitle")} description={t("home.howSubtitle")} />
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((step, index) => (
              <li key={step.title}>
                <Card className="h-full p-5">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <step.icon className="size-5" aria-hidden="true" />
                  </div>
                  <p className="tabular mt-4 text-xs font-semibold text-muted-foreground">
                    {formatNumber(index + 1, locale)}
                  </p>
                  <h3 className="mt-1 text-base font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </Card>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <SectionHeading
          title={t("home.activeCampaignsTitle")}
          description={t("home.activeCampaignsSubtitle")}
          action={
            <Link
              href={`/${locale}/campaigns`}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              {t("actions.viewAll")}
              <Arrow className="size-4" aria-hidden="true" />
            </Link>
          }
        />
        <div className="mt-6">
          {campaigns.length === 0 ? (
            <EmptyState
              icon={<TentTree />}
              title={t("empty.campaigns")}
              description={t("empty.campaignsHint")}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} locale={locale} />
              ))}
            </div>
          )}
        </div>
      </Container>

      <section className="border-y bg-muted/25">
        <Container className="py-12 sm:py-16">
          <SectionHeading title={t("home.recentTreesTitle")} description={t("home.recentTreesSubtitle")} />
          <div className="mt-6">
            {recentTrees.length === 0 ? (
              <EmptyState icon={<Sprout />} title={t("empty.trees")} description={t("empty.treesHint")} />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {recentTrees.map((tree) => (
                  <VerifiedTreeCard key={tree.publicId} tree={tree} locale={locale} />
                ))}
              </div>
            )}
          </div>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <SectionHeading
          title={t("home.wilayasTitle")}
          description={t("home.wilayasSubtitle")}
          action={
            <Link href={`/${locale}/wilayas`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              {t("actions.viewAll")}
              <Arrow className="size-4" aria-hidden="true" />
            </Link>
          }
        />
        <div className="mt-6">
          {coveredWilayas.length === 0 ? (
            <EmptyState icon={<MapPin />} title={t("empty.activity")} description={t("empty.campaignsHint")} />
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {coveredWilayas.map((wilaya) => (
                <li key={wilaya.id}>
                  <Link
                    href={`/${locale}/wilayas/${wilaya.code}`}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary-soft/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {localisedName(wilaya, locale)}
                      </span>
                      <span className="tabular block text-xs text-muted-foreground">
                        {formatNumber(wilaya.verifiedTrees, locale)} {t("wilayas.trees")}
                      </span>
                    </span>
                    <span className="tabular shrink-0 rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground">
                      {wilaya.code}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>

      <section className="border-t bg-primary text-primary-foreground">
        <Container className="py-14 sm:py-20">
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("home.ctaTitle")}</h2>
              <p className="mt-3 text-base leading-relaxed text-primary-foreground/85">{t("home.ctaBody")}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/${locale}/sign-up`}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-primary-foreground text-primary hover:bg-primary-foreground/90",
                )}
              >
                <CalendarCheck className="size-4" aria-hidden="true" />
                {t("home.ctaButton")}
              </Link>
              <Link
                href={`/${locale}/plant`}
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground",
                )}
              >
                {t("home.ctaPlant")}
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
