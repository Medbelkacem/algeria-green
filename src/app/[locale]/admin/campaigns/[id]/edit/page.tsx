import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/db/prisma";
import { env } from "@/lib/env";
import { PageHeader } from "@/components/shared/section";
import { CampaignForm } from "@/components/admin/campaign-form";
import { QrPanel } from "@/components/shared/qr-panel";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: createTranslator(locale)("admin.editCampaign"), robots: { index: false } };
}

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = createTranslator(locale);

  const user = await getCurrentUser();
  if (!hasPermission(user, "campaign:update")) notFound();

  const [campaign, wilayas] = await Promise.all([
    prisma.campaign.findUnique({ where: { id } }),
    prisma.wilaya.findMany({ orderBy: { id: "asc" } }),
  ]);
  if (!campaign) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={t("admin.editCampaign")} description={campaign.title} />

      <div className="grid gap-6 xl:grid-cols-[1fr_18rem]">
        <CampaignForm
          mode="edit"
          locale={locale}
          wilayas={wilayas}
          defaults={{
            id: campaign.id,
            title: campaign.title,
            description: campaign.description,
            coverImageUrl: campaign.coverImageUrl ?? "",
            wilayaId: String(campaign.wilayaId),
            commune: campaign.commune,
            locationLabel: campaign.locationLabel ?? "",
            latitude: campaign.latitude != null ? String(campaign.latitude) : "",
            longitude: campaign.longitude != null ? String(campaign.longitude) : "",
            date: campaign.date.toISOString().slice(0, 10),
            startTime: campaign.startTime ?? "",
            endTime: campaign.endTime ?? "",
            targetTrees: String(campaign.targetTrees),
            maxParticipants: campaign.maxParticipants != null ? String(campaign.maxParticipants) : "",
            organizerName: campaign.organizerName,
            status: campaign.status,
          }}
        />

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <QrPanel
            value={`${env.appUrl}/${locale}/attendance?token=${campaign.attendanceToken}`}
            title={t("campaign.qrTitle")}
            help={t("campaign.qrHelp")}
            copyLabel={t("actions.copy")}
            copiedLabel={t("actions.copied")}
          />
        </aside>
      </div>
    </div>
  );
}
