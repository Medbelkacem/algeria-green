import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TentTree } from "lucide-react";
import { LOCALE_META, isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { prisma } from "@/lib/db/prisma";
import { campaignFilterSchema } from "@/lib/validation/campaign";
import { listPublicCampaigns } from "@/services/campaign.service";
import { Container, PageHeader } from "@/components/shared/section";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { CampaignFilters } from "@/components/campaigns/campaign-filters";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = createTranslator(locale);
  return { title: t("campaign.listTitle"), description: t("campaign.listSubtitle") };
}

export default async function CampaignsPage({
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

  const query = await searchParams;
  const flat = Object.fromEntries(
    Object.entries(query).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );
  // Search parameters are validated exactly like body input.
  const filters = campaignFilterSchema.parse(flat);

  const [result, wilayas] = await Promise.all([
    listPublicCampaigns(filters),
    prisma.wilaya.findMany({ orderBy: { id: "asc" } }),
  ]);

  return (
    <Container className="py-8 sm:py-12">
      <PageHeader title={t("campaign.listTitle")} description={t("campaign.listSubtitle")} />

      <div className="mt-6">
        <CampaignFilters
          locale={locale}
          wilayas={wilayas}
          labels={{
            search: t("actions.search"),
            searchPlaceholder: t("campaign.searchPlaceholder"),
            wilaya: t("campaign.wilaya"),
            allWilayas: t("campaign.allWilayas"),
            status: t("campaign.status"),
            allStatuses: t("campaign.allStatuses"),
            from: t("campaign.dateFrom"),
            to: t("campaign.dateTo"),
            sort: t("actions.sortBy"),
            filters: t("actions.filters"),
            apply: t("actions.apply"),
            reset: t("actions.reset"),
            statusOptions: (["UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"] as const).map((value) => ({
              value,
              label: t(`campaignStatus.${value}`),
            })),
            sortOptions: (["dateAsc", "dateDesc", "newest", "progress"] as const).map((value) => ({
              value,
              label: t(`campaign.sort.${value}`),
            })),
          }}
        />
      </div>

      <div className="mt-8">
        {result.items.length === 0 ? (
          <EmptyState
            icon={<TentTree />}
            title={t("empty.campaigns")}
            description={t("empty.campaignsHint")}
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} locale={locale} />
              ))}
            </div>
            <div className="mt-8">
              <Pagination
                page={result.page}
                total={result.total}
                perPage={result.perPage}
                basePath={`/${locale}/campaigns`}
                baseParams={{
                  q: filters.q,
                  wilayaId: filters.wilayaId ? String(filters.wilayaId) : undefined,
                  status: filters.status,
                  from: filters.from,
                  to: filters.to,
                  sort: filters.sort === "dateAsc" ? undefined : filters.sort,
                }}
                t={t}
                dir={dir}
              />
            </div>
          </>
        )}
      </div>
    </Container>
  );
}
