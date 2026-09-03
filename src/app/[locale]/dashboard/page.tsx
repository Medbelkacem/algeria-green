import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Clock, Sprout, TentTree, TreePine, UserCheck } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { formatNumber } from "@/i18n/format";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getUserTreeStats, listUserTrees } from "@/services/tree.service";
import { PageHeader } from "@/components/shared/section";
import { StatCard } from "@/components/shared/stat-card";
import { TreeStatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateShort } from "@/i18n/format";
import { speciesLabel } from "@/lib/display";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: createTranslator(locale)("dashboard.title"), robots: { index: false } };
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = createTranslator(locale);

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const [stats, recent] = await Promise.all([
    getUserTreeStats(user.id),
    listUserTrees(user.id, { page: 1, perPage: 5 }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("dashboard.welcome", { name: user.name })}
        description={t("dashboard.treesSubtitle")}
        action={
          <Link href={`/${locale}/plant`} className={cn(buttonVariants())}>
            <Sprout className="size-4" aria-hidden="true" />
            {t("dashboard.quickPlant")}
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <StatCard value={formatNumber(stats.total, locale)} label={t("dashboard.myTrees")} icon={<TreePine />} />
        <StatCard
          value={formatNumber(stats.verified, locale)}
          label={t("dashboard.verifiedTrees")}
          icon={<CheckCircle2 />}
          tone="success"
        />
        <StatCard
          value={formatNumber(stats.pending, locale)}
          label={t("dashboard.pendingTrees")}
          icon={<Clock />}
          tone="warning"
        />
        <StatCard
          value={formatNumber(stats.campaignsJoined, locale)}
          label={t("dashboard.campaignsJoined")}
          icon={<TentTree />}
        />
        <StatCard
          value={formatNumber(stats.campaignsAttended, locale)}
          label={t("dashboard.campaignsAttended")}
          icon={<UserCheck />}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.treesTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recent.items.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<Sprout />}
                title={t("empty.trees")}
                description={t("empty.treesHint")}
                action={
                  <Link href={`/${locale}/plant`} className={cn(buttonVariants({ size: "sm" }))}>
                    {t("plant.cta")}
                  </Link>
                }
              />
            </div>
          ) : (
            <ul className="divide-y">
              {recent.items.map((tree) => (
                <li key={tree.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {speciesLabel(tree.species, tree.speciesOther, locale)}
                    </p>
                    <p className="tabular mt-0.5 font-mono text-xs text-muted-foreground">
                      {tree.publicId} · {formatDateShort(tree.plantingDate, locale)}
                    </p>
                  </div>
                  <TreeStatusBadge status={tree.status} t={t} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {recent.total > 5 ? (
        <Link
          href={`/${locale}/dashboard/trees`}
          className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
        >
          {t("actions.viewAll")}
        </Link>
      ) : null}
    </div>
  );
}
