import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QrCode } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/current-user";
import { Container, PageHeader } from "@/components/shared/section";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AttendanceCheckIn } from "@/components/campaigns/attendance-check-in";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AttendancePage({
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
  const token = Array.isArray(query.token) ? query.token[0] : query.token;
  const user = await getCurrentUser();

  return (
    <Container className="max-w-lg py-10 sm:py-16">
      <PageHeader title={t("campaign.attendanceTitle")} description={t("campaign.attendanceBody")} />
      <div className="mt-8">
        {!token ? (
          <EmptyState icon={<QrCode />} title={t("errors.generic")} />
        ) : !user ? (
          <EmptyState
            icon={<QrCode />}
            title={t("campaign.signInToJoin")}
            action={
              <Link
                href={`/${locale}/sign-in?redirectTo=${encodeURIComponent(`/${locale}/attendance?token=${token}`)}`}
                className={cn(buttonVariants())}
              >
                {t("nav.signIn")}
              </Link>
            }
          />
        ) : (
          <AttendanceCheckIn token={token} locale={locale} />
        )}
      </div>
    </Container>
  );
}
