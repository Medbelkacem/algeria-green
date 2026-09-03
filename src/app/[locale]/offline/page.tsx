import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WifiOff } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { Container } from "@/components/shared/section";
import { OfflineRetry } from "@/components/pwa/offline-retry";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OfflinePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const t = createTranslator(raw as Locale);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-warning/15 text-warning">
        <WifiOff className="size-8" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("errors.offlineTitle")}</h1>
      <p className="max-w-md text-muted-foreground">{t("errors.offlineBody")}</p>
      <OfflineRetry label={t("actions.retry")} />
    </Container>
  );
}
