import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LogIn, Sprout } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { listSpecies } from "@/services/tree.service";
import { listJoinableCampaignsForUser } from "@/services/campaign.service";
import { Container, PageHeader } from "@/components/shared/section";
import { buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { PlantForm } from "@/components/trees/plant-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = createTranslator(locale);
  return { title: t("plant.title"), description: t("plant.subtitle") };
}

export default async function PlantPage({
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

  const user = await getCurrentUser();

  if (!user) {
    return (
      <Container className="max-w-3xl py-10 sm:py-14">
        <PageHeader title={t("plant.title")} description={t("plant.subtitle")} />
        <div className="mt-8">
          <EmptyState
            icon={<Sprout />}
            title={t("plant.signInRequired")}
            description={t("auth.signUpSubtitle")}
            action={
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href={`/${locale}/sign-in?redirectTo=${encodeURIComponent(`/${locale}/plant`)}`}
                  className={cn(buttonVariants())}
                >
                  <LogIn className="size-4" aria-hidden="true" />
                  {t("nav.signIn")}
                </Link>
                <Link href={`/${locale}/sign-up`} className={cn(buttonVariants({ variant: "outline" }))}>
                  {t("nav.signUp")}
                </Link>
              </div>
            }
          />
        </div>
      </Container>
    );
  }

  if (user.status === "SUSPENDED") {
    return (
      <Container className="max-w-3xl py-10 sm:py-14">
        <PageHeader title={t("plant.title")} />
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>{t("auth.accountSuspended")}</AlertTitle>
          <AlertDescription>{t("errors.forbiddenBody")}</AlertDescription>
        </Alert>
      </Container>
    );
  }

  const query = await searchParams;
  const requestedCampaign = Array.isArray(query.campaignId) ? query.campaignId[0] : query.campaignId;

  const [species, wilayas, campaigns] = await Promise.all([
    listSpecies(),
    prisma.wilaya.findMany({ orderBy: { id: "asc" } }),
    listJoinableCampaignsForUser(user.id),
  ]);

  // Only pre-select a campaign the user has actually joined.
  const defaultCampaignId =
    requestedCampaign && campaigns.some((campaign) => campaign.id === requestedCampaign)
      ? requestedCampaign
      : null;

  return (
    <Container className="max-w-3xl py-8 sm:py-12">
      <PageHeader title={t("plant.title")} description={t("plant.subtitle")} />
      <div className="mt-8">
        <PlantForm
          locale={locale}
          species={species}
          wilayas={wilayas}
          campaigns={campaigns}
          defaultWilayaId={user.wilayaId}
          defaultCampaignId={defaultCampaignId}
        />
      </div>
    </Container>
  );
}
