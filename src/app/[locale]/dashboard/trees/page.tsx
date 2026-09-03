import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { Sprout } from "lucide-react";
import { LOCALE_META, isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { formatDateShort } from "@/i18n/format";
import { localisedName, speciesLabel } from "@/lib/display";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listUserTrees } from "@/services/tree.service";
import { listCampaignsForUser } from "@/services/campaign.service";
import { PageHeader } from "@/components/shared/section";
import { Pagination } from "@/components/shared/pagination";
import { TreeStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { TreeFilters } from "@/components/trees/tree-filters";

export const dynamic = "force-dynamic";

const filterSchema = z.object({
  status: z.enum(["PENDING", "VERIFIED", "REJECTED", "ARCHIVED"]).optional().catch(undefined),
  campaignId: z.string().max(40).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(1000).catch(1),
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: createTranslator(locale)("dashboard.treesTitle"), robots: { index: false } };
}

export default async function DashboardTreesPage({
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
  if (!user) redirect(`/${locale}/sign-in`);

  const query = await searchParams;
  const filters = filterSchema.parse(
    Object.fromEntries(
      Object.entries(query).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
    ),
  );

  const [result, participation] = await Promise.all([
    listUserTrees(user.id, filters),
    listCampaignsForUser(user.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard.treesTitle")}
        description={t("dashboard.treesSubtitle")}
        action={
          <Link href={`/${locale}/plant`} className={cn(buttonVariants({ size: "sm" }))}>
            <Sprout className="size-4" aria-hidden="true" />
            {t("dashboard.quickPlant")}
          </Link>
        }
      />

      <TreeFilters
        campaigns={participation.map((p) => ({ id: p.campaign.id, title: p.campaign.title }))}
        labels={{
          status: t("tree.status"),
          allStatuses: t("campaign.allStatuses"),
          campaign: t("tree.campaign"),
          allCampaigns: t("actions.all"),
          apply: t("actions.apply"),
          reset: t("actions.reset"),
          statusOptions: (["PENDING", "VERIFIED", "REJECTED", "ARCHIVED"] as const).map((value) => ({
            value,
            label: t(`treeStatus.${value}`),
          })),
        }}
      />

      {result.items.length === 0 ? (
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
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tree.id")}</TableHead>
                <TableHead>{t("tree.species")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("tree.plantingDate")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("tree.wilaya")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("tree.campaign")}</TableHead>
                <TableHead>{t("tree.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((tree) => (
                <TableRow key={tree.id}>
                  <TableCell className="font-mono text-xs">
                    {tree.status === "VERIFIED" ? (
                      <Link href={`/${locale}/tree/${tree.publicId}`} className="text-primary hover:underline">
                        {tree.publicId}
                      </Link>
                    ) : (
                      tree.publicId
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {speciesLabel(tree.species, tree.speciesOther, locale)}
                  </TableCell>
                  <TableCell className="tabular hidden sm:table-cell">
                    {formatDateShort(tree.plantingDate, locale)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {localisedName(tree.wilaya, locale)}
                  </TableCell>
                  <TableCell className="hidden max-w-40 truncate lg:table-cell">
                    {tree.campaign ? tree.campaign.title : t("tree.individual")}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <TreeStatusBadge status={tree.status} t={t} />
                      {tree.reviewReason ? (
                        <p className="max-w-48 text-xs text-muted-foreground">{tree.reviewReason}</p>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            page={result.page}
            total={result.total}
            perPage={result.perPage}
            basePath={`/${locale}/dashboard/trees`}
            baseParams={{ status: filters.status, campaignId: filters.campaignId }}
            t={t}
            dir={dir}
          />
        </>
      )}
    </div>
  );
}
