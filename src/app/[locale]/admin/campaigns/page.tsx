import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Pencil, Plus, TentTree } from "lucide-react";
import { LOCALE_META, isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { formatDateShort, formatNumber } from "@/i18n/format";
import { localisedName } from "@/lib/display";
import { cn, progressPercent } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/section";
import { Pagination } from "@/components/shared/pagination";
import { CampaignStatusBadge } from "@/components/shared/status-badge";
import { CampaignStatusActions } from "@/components/admin/campaign-status-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";
const PER_PAGE = 20;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: createTranslator(locale)("admin.campaigns"), robots: { index: false } };
}

export default async function AdminCampaignsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = createTranslator(locale);
  const dir = LOCALE_META[locale].dir;

  const user = await getCurrentUser();
  if (!hasPermission(user, "campaign:create")) notFound();

  const query = await searchParams;
  const page = z.coerce.number().int().min(1).max(1000).catch(1).parse(query.page);

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true, slug: true, title: true, date: true, commune: true, status: true, targetTrees: true,
        wilaya: { select: { nameAr: true, nameFr: true, nameEn: true } },
        _count: { select: { participants: true } },
      },
    }),
    prisma.campaign.count(),
  ]);

  const verified = campaigns.length
    ? await prisma.tree.groupBy({
        by: ["campaignId"],
        where: { status: "VERIFIED", campaignId: { in: campaigns.map((c) => c.id) } },
        _count: { _all: true },
      })
    : [];
  const verifiedMap = new Map(verified.map((row) => [row.campaignId as string, row._count._all]));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.campaigns")}
        action={
          <Link href={`/${locale}/admin/campaigns/new`} className={cn(buttonVariants({ size: "sm" }))}>
            <Plus className="size-4" aria-hidden="true" />
            {t("admin.newCampaign")}
          </Link>
        }
      />

      {campaigns.length === 0 ? (
        <EmptyState
          icon={<TentTree />}
          title={t("empty.campaigns")}
          action={
            <Link href={`/${locale}/admin/campaigns/new`} className={cn(buttonVariants({ size: "sm" }))}>
              {t("admin.newCampaign")}
            </Link>
          }
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("campaign.title")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("campaign.wilaya")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("campaign.date")}</TableHead>
                <TableHead>{t("campaign.progress")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("campaign.participants")}</TableHead>
                <TableHead>{t("campaign.status")}</TableHead>
                <TableHead className="w-24">{t("actions.edit")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => {
                const verifiedTrees = verifiedMap.get(campaign.id) ?? 0;
                return (
                  <TableRow key={campaign.id}>
                    <TableCell className="max-w-56 truncate font-medium">
                      <Link href={`/${locale}/campaigns/${campaign.slug}`} className="hover:text-primary hover:underline">
                        {campaign.title}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {campaign.commune}، {localisedName(campaign.wilaya, locale)}
                    </TableCell>
                    <TableCell className="tabular hidden sm:table-cell">
                      {formatDateShort(campaign.date, locale)}
                    </TableCell>
                    <TableCell className="tabular">
                      {formatNumber(verifiedTrees, locale)} / {formatNumber(campaign.targetTrees, locale)}
                      <span className="ms-2 text-xs text-muted-foreground">
                        {progressPercent(verifiedTrees, campaign.targetTrees)}%
                      </span>
                    </TableCell>
                    <TableCell className="tabular hidden lg:table-cell">
                      {formatNumber(campaign._count.participants, locale)}
                    </TableCell>
                    <TableCell>
                      <CampaignStatusBadge status={campaign.status} t={t} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/${locale}/admin/campaigns/${campaign.id}/edit`}
                          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                          aria-label={t("actions.edit")}
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <CampaignStatusActions
                          campaignId={campaign.id}
                          status={campaign.status}
                          locale={locale}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Pagination
            page={page}
            total={total}
            perPage={PER_PAGE}
            basePath={`/${locale}/admin/campaigns`}
            baseParams={{}}
            t={t}
            dir={dir}
          />
        </>
      )}
    </div>
  );
}
