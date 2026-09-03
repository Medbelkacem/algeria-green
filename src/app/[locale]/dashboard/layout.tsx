import { notFound, redirect } from "next/navigation";
import { Bell, LayoutDashboard, Settings, TentTree, TreePine } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { getCurrentUser } from "@/lib/auth/current-user";
import { Container } from "@/components/shared/section";
import { SideNav } from "@/components/dashboard/side-nav";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = createTranslator(locale);

  // Server-side guard. The proxy does no authorisation, so this is the gate.
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/sign-in?redirectTo=${encodeURIComponent(`/${locale}/dashboard`)}`);

  const items = [
    { href: `/${locale}/dashboard`, label: t("nav.dashboard"), icon: <LayoutDashboard />, exact: true },
    { href: `/${locale}/dashboard/trees`, label: t("dashboard.myTrees"), icon: <TreePine /> },
    { href: `/${locale}/dashboard/campaigns`, label: t("dashboard.campaignsTitle"), icon: <TentTree /> },
    { href: `/${locale}/dashboard/notifications`, label: t("notifications.title"), icon: <Bell /> },
    { href: `/${locale}/dashboard/settings`, label: t("dashboard.settings"), icon: <Settings /> },
  ];

  return (
    <Container className="py-6 sm:py-10">
      {user.status === "SUSPENDED" ? (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>{t("auth.accountSuspended")}</AlertTitle>
          <AlertDescription>{t("errors.forbiddenBody")}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[13rem_1fr] lg:gap-10">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <SideNav items={items} ariaLabel={t("nav.dashboard")} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
