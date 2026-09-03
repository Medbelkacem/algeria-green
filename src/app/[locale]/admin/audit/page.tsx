import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ScrollText } from "lucide-react";
import { LOCALE_META, isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { formatDateTime } from "@/i18n/format";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/permissions";
import { listAuditLogs } from "@/services/audit.service";
import { PageHeader } from "@/components/shared/section";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";
const PER_PAGE = 30;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: createTranslator(locale)("admin.auditLog"), robots: { index: false } };
}

export default async function AuditLogPage({
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
  const dir = LOCALE_META[locale].dir;

  const user = await getCurrentUser();
  if (!hasPermission(user, "audit:read")) notFound();

  const query = await searchParams;
  const page = z.coerce.number().int().min(1).max(1000).catch(1).parse(query.page);
  const { items, total } = await listAuditLogs({ page, perPage: PER_PAGE });

  return (
    <div className="space-y-6">
      <PageHeader title={t("admin.auditLog")} description={t("admin.auditSubtitle")} />

      {items.length === 0 ? (
        <EmptyState icon={<ScrollText />} title={t("empty.audit")} />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.action")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("admin.actor")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("admin.entity")}</TableHead>
                <TableHead>{t("tree.submittedAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {entry.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden max-w-48 truncate sm:table-cell">
                    {entry.actor ? entry.actor.name : t("admin.system")}
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs md:table-cell">
                    {entry.entityType}
                    {entry.entityId ? `:${entry.entityId.slice(0, 8)}` : ""}
                  </TableCell>
                  <TableCell className="tabular whitespace-nowrap">
                    {formatDateTime(entry.createdAt, locale)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            page={page}
            total={total}
            perPage={PER_PAGE}
            basePath={`/${locale}/admin/audit`}
            baseParams={{}}
            t={t}
            dir={dir}
          />
        </>
      )}
    </div>
  );
}
