import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { formatDateTime } from "@/i18n/format";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listNotifications } from "@/services/notification.service";
import { PageHeader } from "@/components/shared/section";
import { EmptyState } from "@/components/ui/empty-state";
import { MarkAllReadButton } from "@/components/dashboard/mark-all-read";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: createTranslator(locale)("notifications.title"), robots: { index: false } };
}

export default async function NotificationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = createTranslator(locale);

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const notifications = await listNotifications(user.id);
  const hasUnread = notifications.some((notification) => !notification.readAt);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("notifications.title")}
        action={hasUnread ? <MarkAllReadButton locale={locale} label={t("actions.markAllRead")} /> : undefined}
      />

      {notifications.length === 0 ? (
        <EmptyState icon={<Bell />} title={t("empty.notifications")} />
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {notifications.map((notification) => {
            // Text is rendered from the catalogue, so it follows the reader's language.
            const data = (notification.data ?? {}) as Record<string, string>;
            return (
              <li
                key={notification.id}
                className={cn("flex items-start gap-3 p-4", !notification.readAt && "bg-primary-soft/30")}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    notification.readAt ? "bg-border" : "bg-primary",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{t(`notifications.${notification.type}`, data)}</p>
                  <p className="tabular mt-1 text-xs text-muted-foreground">
                    {formatDateTime(notification.createdAt, locale)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
