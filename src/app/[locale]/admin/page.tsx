import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2, ClipboardList, MapPin, TentTree, TreePine, Users, UsersRound, XCircle,
} from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { formatNumber } from "@/i18n/format";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/permissions";
import { getAdminStats } from "@/services/analytics.service";
import { PageHeader } from "@/components/shared/section";
import { StatCard } from "@/components/shared/stat-card";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: createTranslator(locale)("admin.overview"), robots: { index: false } };
}

export default async function AdminOverviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = createTranslator(locale);

  const user = await getCurrentUser();
  if (!hasPermission(user, "admin:access")) notFound();

  const stats = await getAdminStats();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.overview")}
        description={t("misc.verifiedOnly")}
        action={
          <Link
            href={`/${locale}/admin/trees/pending`}
            className={cn(buttonVariants({ size: "sm", variant: stats.pendingTrees > 0 ? "default" : "outline" }))}
          >
            <ClipboardList className="size-4" aria-hidden="true" />
            {t("admin.pendingReviews")}
            {stats.pendingTrees > 0 ? ` (${formatNumber(stats.pendingTrees, locale)})` : ""}
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard value={formatNumber(stats.totalUsers, locale)} label={t("admin.totalUsers")} icon={<Users />} />
        <StatCard value={formatNumber(stats.totalCampaigns, locale)} label={t("admin.totalCampaigns")} icon={<TentTree />} />
        <StatCard value={formatNumber(stats.totalTrees, locale)} label={t("admin.totalTrees")} icon={<TreePine />} />
        <StatCard
          value={formatNumber(stats.pendingTrees, locale)}
          label={t("admin.pendingReviews")}
          icon={<ClipboardList />}
          tone={stats.pendingTrees > 0 ? "warning" : "default"}
        />
        <StatCard
          value={formatNumber(stats.verifiedTrees, locale)}
          label={t("admin.verifiedTrees")}
          icon={<CheckCircle2 />}
          tone="success"
        />
        <StatCard
          value={formatNumber(stats.rejectedTrees, locale)}
          label={t("admin.rejectedTrees")}
          icon={<XCircle />}
          tone="destructive"
        />
        <StatCard value={formatNumber(stats.participants, locale)} label={t("admin.participants")} icon={<UsersRound />} />
        <StatCard value={formatNumber(stats.wilayasCovered, locale)} label={t("admin.wilayasCovered")} icon={<MapPin />} />
      </div>
    </div>
  );
}
