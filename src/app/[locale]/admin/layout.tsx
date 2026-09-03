import { notFound, redirect } from "next/navigation";
import { ClipboardList, LayoutDashboard, ScrollText, TentTree, Users } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/permissions";
import { Container } from "@/components/shared/section";
import { SideNav, type SideNavItem } from "@/components/dashboard/side-nav";
import { Badge } from "@/components/ui/badge";

export default async function AdminLayout({
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

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/sign-in?redirectTo=${encodeURIComponent(`/${locale}/admin`)}`);
  // Every admin route is gated here and again inside each server action.
  if (!hasPermission(user, "admin:access")) notFound();

  const items: SideNavItem[] = [
    { href: `/${locale}/admin`, label: t("admin.overview"), icon: <LayoutDashboard />, exact: true },
    { href: `/${locale}/admin/trees/pending`, label: t("admin.pendingReviews"), icon: <ClipboardList /> },
  ];
  if (hasPermission(user, "campaign:create")) {
    items.push({ href: `/${locale}/admin/campaigns`, label: t("admin.campaigns"), icon: <TentTree /> });
  }
  if (hasPermission(user, "user:list")) {
    items.push({ href: `/${locale}/admin/users`, label: t("admin.users"), icon: <Users /> });
  }
  if (hasPermission(user, "audit:read")) {
    items.push({ href: `/${locale}/admin/audit`, label: t("admin.auditLog"), icon: <ScrollText /> });
  }

  return (
    <Container className="py-6 sm:py-10">
      <div className="mb-5 flex items-center gap-3">
        <h1 className="text-lg font-semibold">{t("admin.title")}</h1>
        <Badge variant="secondary">{t(`role.${user.role}`)}</Badge>
      </div>
      <div className="grid gap-6 lg:grid-cols-[14rem_1fr] lg:gap-10">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <SideNav items={items} ariaLabel={t("admin.title")} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
