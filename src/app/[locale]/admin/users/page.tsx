import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Users } from "lucide-react";
import { LOCALE_META, isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { formatDateShort, formatNumber } from "@/i18n/format";
import { localisedName } from "@/lib/display";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ASSIGNABLE_ROLES, hasPermission, roleRank } from "@/lib/permissions";
import { listUsers } from "@/services/user.service";
import { PageHeader } from "@/components/shared/section";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { UserActions } from "@/components/admin/user-actions";
import { UserFilters } from "@/components/admin/user-filters";

export const dynamic = "force-dynamic";

const filterSchema = z.object({
  q: z.string().trim().max(120).optional().catch(undefined),
  role: z.enum(["USER", "ASSOCIATION", "MODERATOR", "ADMIN", "SUPER_ADMIN"]).optional().catch(undefined),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(1000).catch(1),
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: createTranslator(locale)("admin.usersTitle"), robots: { index: false } };
}

export default async function AdminUsersPage({
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

  const actor = await getCurrentUser();
  if (!hasPermission(actor, "user:list")) notFound();

  const query = await searchParams;
  const filters = filterSchema.parse(
    Object.fromEntries(
      Object.entries(query).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
    ),
  );

  const result = await listUsers(filters);
  const canChangeRole = hasPermission(actor, "user:changeRole");
  // Only roles strictly below the actor's own rank may ever be offered.
  const assignable = ASSIGNABLE_ROLES.filter((role) => roleRank(role) < roleRank(actor!.role));

  return (
    <div className="space-y-6">
      <PageHeader title={t("admin.usersTitle")} description={t("admin.usersSubtitle")} />

      <UserFilters
        labels={{
          search: t("actions.search"),
          searchPlaceholder: t("actions.search"),
          role: t("admin.role"),
          allRoles: t("actions.all"),
          status: t("admin.userStatus"),
          allStatuses: t("campaign.allStatuses"),
          apply: t("actions.apply"),
          reset: t("actions.reset"),
          roleOptions: (["USER", "ASSOCIATION", "MODERATOR", "ADMIN", "SUPER_ADMIN"] as const).map((value) => ({
            value,
            label: t(`role.${value}`),
          })),
          statusOptions: (["ACTIVE", "SUSPENDED"] as const).map((value) => ({
            value,
            label: t(`userStatus.${value}`),
          })),
        }}
      />

      {result.items.length === 0 ? (
        <EmptyState icon={<Users />} title={t("empty.users")} description={t("empty.resultsHint")} />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("auth.name")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("auth.email")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("auth.wilaya")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("stats.totalTrees")}</TableHead>
                <TableHead>{t("admin.role")}</TableHead>
                <TableHead>{t("admin.userStatus")}</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{row.name}</p>
                      <p className="tabular text-xs text-muted-foreground">
                        {formatDateShort(row.createdAt, locale)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-56 truncate md:table-cell" dir="ltr">
                    {row.email}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {row.wilaya ? localisedName(row.wilaya, locale) : t("misc.unknown")}
                  </TableCell>
                  <TableCell className="tabular hidden sm:table-cell">
                    {formatNumber(row._count.trees, locale)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.role === "USER" ? "muted" : "secondary"}>{t(`role.${row.role}`)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.status === "ACTIVE" ? "success" : "destructive"}>
                      {t(`userStatus.${row.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <UserActions
                      userId={row.id}
                      status={row.status}
                      role={row.role}
                      locale={locale}
                      canChangeRole={canChangeRole && roleRank(row.role) < roleRank(actor!.role)}
                      assignableRoles={assignable}
                      isSelf={row.id === actor!.id}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            page={result.page}
            total={result.total}
            perPage={result.perPage}
            basePath={`/${locale}/admin/users`}
            baseParams={{ q: filters.q, role: filters.role, status: filters.status }}
            t={t}
            dir={dir}
          />
        </>
      )}
    </div>
  );
}
