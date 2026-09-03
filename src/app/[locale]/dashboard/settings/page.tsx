import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { MailCheck, MailWarning } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PasswordForm, ProfileForm, ResendVerificationButton } from "@/components/dashboard/settings-forms";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: createTranslator(locale)("dashboard.settings"), robots: { index: false } };
}

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = createTranslator(locale);

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const wilayas = await prisma.wilaya.findMany({ orderBy: { id: "asc" } });

  return (
    <div className="space-y-6">
      <PageHeader title={t("profile.editTitle")} />

      {user.emailVerified ? (
        <Alert variant="success">
          <MailCheck aria-hidden="true" />
          <AlertDescription className="text-foreground">{t("auth.verifyDone")}</AlertDescription>
        </Alert>
      ) : (
        <Alert variant="warning">
          <MailWarning aria-hidden="true" />
          <AlertTitle>{t("auth.verifyPending")}</AlertTitle>
          <AlertDescription>
            <div className="mt-2">
              <ResendVerificationButton locale={locale} />
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("profile.editTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            locale={locale}
            wilayas={wilayas}
            defaults={{
              name: user.name,
              wilayaId: user.wilayaId,
              locale: user.locale,
              publicProfile: user.publicProfile,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("profile.changePassword")}</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordForm locale={locale} />
        </CardContent>
      </Card>
    </div>
  );
}
