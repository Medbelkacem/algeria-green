import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays, Clock, MapPin, Sprout, Target, TreePine, Users,
} from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { formatDate, formatNumber } from "@/i18n/format";
import { localisedName } from "@/lib/display";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCampaignDetail } from "@/services/campaign.service";
import { Container } from "@/components/shared/section";
import { CampaignStatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { buttonVariants } from "@/components/ui/button";
import { JoinCampaignButton } from "@/components/campaigns/join-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isLocale(locale)) return {};
  const campaign = await getCampaignDetail(id);
  if (!campaign) return { title: createTranslator(locale)("errors.notFoundTitle") };
  return {
    title: campaign.title,
    description: campaign.description.slice(0, 160),
    openGraph: {
      title: campaign.title,
      description: campaign.description.slice(0, 160),
      images: campaign.coverImageUrl ? [campaign.coverImageUrl] : undefined,
    },
  };
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = createTranslator(locale);

  const user = await getCurrentUser();
  const campaign = await getCampaignDetail(id, user?.id);
  // Drafts are never reachable from a public URL.
  if (!campaign || campaign.status === "DRAFT") notFound();

  const wilaya = localisedName(campaign.wilaya, locale);
  const participantCount = campaign._count.participants;
  const isFull = campaign.maxParticipants != null && participantCount >= campaign.maxParticipants;
  const isOpen = campaign.status === "UPCOMING" || campaign.status === "ACTIVE";
  const alreadyJoined = Boolean(campaign.participation && campaign.participation.status !== "CANCELLED");

  const facts = [
    { icon: MapPin, label: t("campaign.wilaya"), value: `${campaign.commune}، ${wilaya}` },
    { icon: CalendarDays, label: t("campaign.date"), value: formatDate(campaign.date, locale) },
    ...(campaign.startTime
      ? [{
          icon: Clock,
          label: t("campaign.startTime"),
          value: campaign.endTime ? `${campaign.startTime} – ${campaign.endTime}` : campaign.startTime,
        }]
      : []),
    { icon: Users, label: t("campaign.organizer"), value: campaign.organizerName },
    ...(campaign.locationLabel
      ? [{ icon: MapPin, label: t("campaign.location"), value: campaign.locationLabel }]
      : []),
  ];

  return (
    <article>
      <div className="relative aspect-[21/9] max-h-[420px] w-full overflow-hidden bg-primary-soft">
        {campaign.coverImageUrl ? (
          <Image
            src={campaign.coverImageUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="bg-hero flex size-full items-center justify-center" aria-hidden="true">
            <TreePine className="size-20 text-primary/30" />
          </div>
        )}
      </div>

      <Container className="py-8 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div className="min-w-0 space-y-8">
            <header className="space-y-3">
              <CampaignStatusBadge status={campaign.status} t={t} />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{campaign.title}</h1>
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4" aria-hidden="true" />
                  {campaign.commune}، {wilaya}
                </span>
                <span className="tabular flex items-center gap-1.5">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  {formatDate(campaign.date, locale)}
                </span>
              </p>
            </header>

            <section aria-labelledby="campaign-description">
              <h2 id="campaign-description" className="sr-only">
                {t("campaign.description")}
              </h2>
              <div className="space-y-4 text-sm leading-relaxed text-foreground/90 sm:text-base">
                {campaign.description.split(/\n{2,}/).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </section>

            <section aria-labelledby="campaign-facts">
              <h2 id="campaign-facts" className="text-lg font-semibold">
                {t("actions.viewDetails")}
              </h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {facts.map((fact) => (
                  <div key={fact.label} className="flex items-start gap-3 rounded-lg border bg-card p-4">
                    <fact.icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                      <dd className="truncate text-sm font-medium">{fact.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardContent className="space-y-5 p-5">
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="tabular text-2xl font-bold text-primary">
                      {formatNumber(campaign.verifiedTrees, locale)}
                      <span className="text-base font-medium text-muted-foreground">
                        {" / "}
                        {formatNumber(campaign.targetTrees, locale)}
                      </span>
                    </span>
                    <span className="tabular text-sm font-semibold">{campaign.progress}%</span>
                  </div>
                  <Progress
                    value={campaign.progress}
                    aria-label={t("a11y.progressLabel", { percent: campaign.progress })}
                  />
                  <p className="text-xs text-muted-foreground">{t("misc.verifiedOnly")}</p>
                </div>

                <dl className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="size-3.5" aria-hidden="true" />
                      {t("campaign.participants")}
                    </dt>
                    <dd className="tabular mt-1 text-lg font-semibold">
                      {formatNumber(participantCount, locale)}
                      {campaign.maxParticipants ? (
                        <span className="text-sm font-normal text-muted-foreground">
                          {" / "}
                          {formatNumber(campaign.maxParticipants, locale)}
                        </span>
                      ) : null}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Target className="size-3.5" aria-hidden="true" />
                      {t("campaign.targetTrees")}
                    </dt>
                    <dd className="tabular mt-1 text-lg font-semibold">
                      {formatNumber(campaign.targetTrees, locale)}
                    </dd>
                  </div>
                </dl>

                <JoinCampaignButton
                  campaignId={campaign.id}
                  locale={locale}
                  isAuthenticated={Boolean(user)}
                  alreadyJoined={alreadyJoined}
                  disabledReason={!isOpen ? "closed" : isFull ? "full" : null}
                />

                {alreadyJoined ? (
                  <Link
                    href={`/${locale}/plant?campaignId=${campaign.id}`}
                    className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                  >
                    <Sprout className="size-4" aria-hidden="true" />
                    {t("campaign.submitTree")}
                  </Link>
                ) : null}
              </CardContent>
            </Card>

            {alreadyJoined ? (
              <Card>
                <CardContent className="space-y-2 p-5">
                  <h2 className="text-sm font-semibold">{t("campaign.attendanceTitle")}</h2>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {t("campaign.attendanceBody")}
                  </p>
                  {campaign.participation?.attendedAt ? (
                    <p className="text-xs font-medium text-success">{t("campaign.attendanceRecorded")}</p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </aside>
        </div>
      </Container>
    </article>
  );
}
