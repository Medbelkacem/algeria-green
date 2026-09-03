import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, MapPin, Sprout, TentTree } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { formatDateShort, formatDateTime, formatNumber } from "@/i18n/format";
import { localisedName } from "@/lib/display";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listCampaignsForUser } from "@/services/campaign.service";
import { PageHeader } from "@/components/shared/section";
import { CampaignStatusBadge, ParticipantStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: createTranslator(locale)("dashboard.campaignsTitle"), robots: { index: false } };
}

export default async function DashboardCampaignsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = createTranslator(locale);

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const participation = await listCampaignsForUser(user.id);

  return (
    <div className="space-y-6">
      <PageHeader title={t("dashboard.campaignsTitle")} description={t("dashboard.campaignsSubtitle")} />

      {participation.length === 0 ? (
        <EmptyState
          icon={<TentTree />}
          title={t("empty.campaigns")}
          description={t("empty.campaignsHint")}
          action={
            <Link href={`/${locale}/campaigns`} className={cn(buttonVariants({ size: "sm" }))}>
              {t("home.ctaCampaigns")}
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {participation.map((entry) => (
            <li key={entry.id}>
              <Card>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <Link
                      href={`/${locale}/campaigns/${entry.campaign.slug}`}
                      className="text-base font-semibold hover:text-primary hover:underline"
                    >
                      {entry.campaign.title}
                    </Link>
                    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-3.5" aria-hidden="true" />
                        {entry.campaign.commune}، {localisedName(entry.campaign.wilaya, locale)}
                      </span>
                      <span className="tabular">{formatDateShort(entry.campaign.date, locale)}</span>
                      <span className="tabular flex items-center gap-1.5">
                        <Sprout className="size-3.5" aria-hidden="true" />
                        {formatNumber(entry.treesSubmitted, locale)} {t("dashboard.treesSubmitted")}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("dashboard.attendance")}:{" "}
                      {entry.attendedAt ? (
                        <span className="tabular inline-flex items-center gap-1 font-medium text-success">
                          <CheckCircle2 className="size-3.5" aria-hidden="true" />
                          {formatDateTime(entry.attendedAt, locale)}
                        </span>
                      ) : (
                        t("dashboard.notAttended")
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <ParticipantStatusBadge status={entry.status} t={t} />
                    <CampaignStatusBadge status={entry.campaign.status} t={t} />
                    <Link
                      href={`/${locale}/plant?campaignId=${entry.campaign.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      {t("plant.cta")}
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
