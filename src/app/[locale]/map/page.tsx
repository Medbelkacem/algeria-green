import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Info } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { localisedName } from "@/lib/display";
import { prisma } from "@/lib/db/prisma";
import { listMapCampaigns, listMapTrees } from "@/services/tree.service";
import { Container, PageHeader } from "@/components/shared/section";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlantingMap } from "@/components/map/planting-map";
import { MapFilters } from "@/components/map/map-filters";

export const revalidate = 120;

const DEFAULT_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const DEFAULT_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const filterSchema = z.object({
  wilayaId: z.coerce.number().int().optional().catch(undefined),
  campaignId: z.string().max(40).optional().catch(undefined),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = createTranslator(locale);
  return { title: t("map.title"), description: t("map.subtitle") };
}

export default async function MapPage({
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

  const query = await searchParams;
  const filters = filterSchema.parse(
    Object.fromEntries(
      Object.entries(query).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
    ),
  );

  const [trees, campaigns, wilayas, campaignOptions] = await Promise.all([
    listMapTrees(filters),
    listMapCampaigns({ wilayaId: filters.wilayaId }),
    prisma.wilaya.findMany({ orderBy: { id: "asc" } }),
    prisma.campaign.findMany({
      where: { status: { in: ["UPCOMING", "ACTIVE", "COMPLETED"] } },
      select: { id: true, title: true },
      orderBy: { date: "desc" },
      take: 200,
    }),
  ]);

  return (
    <Container className="py-8 sm:py-12">
      <PageHeader title={t("map.title")} description={t("map.subtitle")} />

      <Alert variant="info" className="mt-6">
        <Info aria-hidden="true" />
        <AlertDescription className="text-foreground">{t("map.privacyNote")}</AlertDescription>
      </Alert>

      <div className="mt-6 space-y-4">
        <MapFilters
          locale={locale}
          wilayas={wilayas.map((w) => ({ id: w.id, code: w.code, name: localisedName(w, locale) }))}
          campaigns={campaignOptions}
          labels={{
            wilaya: t("campaign.wilaya"),
            allWilayas: t("campaign.allWilayas"),
            campaign: t("tree.campaign"),
            allCampaigns: t("actions.all"),
            from: t("campaign.dateFrom"),
            to: t("campaign.dateTo"),
            apply: t("actions.apply"),
            reset: t("actions.reset"),
          }}
        />

        <PlantingMap
          locale={locale}
          trees={trees.map(({ publicId, lat, lng, wilayaId }) => ({ publicId, lat, lng, wilayaId }))}
          campaigns={campaigns.map(({ id, slug, title, status, commune, lat, lng }) => ({
            id, slug, title, status, commune, lat, lng,
          }))}
          tileUrl={process.env.NEXT_PUBLIC_MAP_TILE_URL || DEFAULT_TILE_URL}
          labels={{
            trees: t("map.trees"),
            campaigns: t("map.campaigns"),
            layers: t("map.layers"),
            loading: t("map.loading"),
            noPoints: t("map.noPoints"),
            privacy: t("map.privacyNote"),
            viewDetails: t("actions.viewDetails"),
            attribution: process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || DEFAULT_ATTRIBUTION,
          }}
        />
      </div>
    </Container>
  );
}
