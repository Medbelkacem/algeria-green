import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/section";
import { CampaignForm } from "@/components/admin/campaign-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: createTranslator(locale)("admin.newCampaign"), robots: { index: false } };
}

export default async function NewCampaignPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = createTranslator(locale);

  const user = await getCurrentUser();
  if (!hasPermission(user, "campaign:create")) notFound();

  const wilayas = await prisma.wilaya.findMany({ orderBy: { id: "asc" } });

  return (
    <div className="space-y-6">
      <PageHeader title={t("admin.newCampaign")} />
      <CampaignForm
        mode="create"
        locale={locale}
        wilayas={wilayas}
        defaults={{
          title: "", description: "", coverImageUrl: "", wilayaId: user?.wilayaId ? String(user.wilayaId) : "",
          commune: "", locationLabel: "", latitude: "", longitude: "",
          date: new Date().toISOString().slice(0, 10), startTime: "", endTime: "",
          targetTrees: "100", maxParticipants: "", organizerName: "", status: "DRAFT",
        }}
      />
    </div>
  );
}
