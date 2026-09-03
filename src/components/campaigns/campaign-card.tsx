import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin, TreePine, Users } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { formatDateShort, formatNumber } from "@/i18n/format";
import { localisedName } from "@/lib/display";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CampaignStatusBadge } from "@/components/shared/status-badge";
import type { CampaignCard as CampaignCardData } from "@/services/campaign.service";

export function CampaignCard({ campaign, locale }: { campaign: CampaignCardData; locale: Locale }) {
  const t = createTranslator(locale);
  const wilaya = localisedName(campaign.wilaya, locale);

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/${locale}/campaigns/${campaign.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-primary-soft">
          {campaign.coverImageUrl ? (
            <Image
              src={campaign.coverImageUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex size-full items-center justify-center" aria-hidden="true">
              <TreePine className="size-12 text-primary/35" />
            </div>
          )}
          <div className="absolute end-3 top-3">
            <CampaignStatusBadge status={campaign.status} t={t} />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug">{campaign.title}</h3>

          <dl className="space-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              <dt className="sr-only">{t("campaign.wilaya")}</dt>
              <dd className="truncate">
                {campaign.commune}، {wilaya}
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
              <dt className="sr-only">{t("campaign.date")}</dt>
              <dd className="tabular">
                {formatDateShort(campaign.date, locale)}
                {campaign.startTime ? ` · ${campaign.startTime}` : ""}
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <Users className="size-4 shrink-0" aria-hidden="true" />
              <dt className="sr-only">{t("campaign.participants")}</dt>
              <dd className="tabular">
                {formatNumber(campaign._count.participants, locale)}
                {campaign.maxParticipants ? ` / ${formatNumber(campaign.maxParticipants, locale)}` : ""}
              </dd>
            </div>
          </dl>

          <div className="mt-auto space-y-2 pt-2">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="tabular font-medium">
                {formatNumber(campaign.verifiedTrees, locale)} / {formatNumber(campaign.targetTrees, locale)}
              </span>
              <span className="tabular text-xs text-muted-foreground">{campaign.progress}%</span>
            </div>
            <Progress
              value={campaign.progress}
              aria-label={t("a11y.progressLabel", { percent: campaign.progress })}
            />
            <p className="text-xs text-muted-foreground">{t("campaign.verifiedTrees")}</p>
          </div>
        </div>
      </Link>
    </Card>
  );
}
