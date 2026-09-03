import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ClipboardCheck, ImageOff, MapPin } from "lucide-react";
import { LOCALE_META, isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { formatDate, formatDateTime } from "@/i18n/format";
import { localisedName, speciesLabel } from "@/lib/display";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/permissions";
import { listPendingTrees } from "@/services/tree.service";
import { PageHeader } from "@/components/shared/section";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewPanel } from "@/components/admin/review-panel";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: createTranslator(locale)("admin.reviewTitle"), robots: { index: false } };
}

export default async function PendingTreesPage({
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
  if (!hasPermission(user, "tree:review")) notFound();

  const query = await searchParams;
  const page = z.coerce.number().int().min(1).max(1000).catch(1).parse(query.page);
  const result = await listPendingTrees(page);

  return (
    <div className="space-y-6">
      <PageHeader title={t("admin.reviewTitle")} description={t("admin.reviewSubtitle")} />

      {result.items.length === 0 ? (
        <EmptyState icon={<ClipboardCheck />} title={t("empty.pending")} description={t("empty.pendingHint")} />
      ) : (
        <>
          <ul className="space-y-4">
            {result.items.map((tree) => (
              <li key={tree.id}>
                <Card>
                  <CardContent className="grid gap-5 p-5 sm:grid-cols-[13rem_1fr]">
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted sm:aspect-auto sm:h-52">
                      {tree.photoUrl ? (
                        <Image src={tree.photoUrl} alt="" fill sizes="220px" className="object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                          <ImageOff className="size-8" aria-hidden="true" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="muted" className="font-mono text-[10px]">
                          {tree.publicId}
                        </Badge>
                        <Badge variant="warning">{t("treeStatus.PENDING")}</Badge>
                        {tree.campaign ? (
                          <Badge variant="info">{tree.campaign.title}</Badge>
                        ) : (
                          <Badge variant="secondary">{t("tree.individual")}</Badge>
                        )}
                      </div>

                      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                        <Row label={t("tree.species")} value={speciesLabel(tree.species, tree.speciesOther, locale)} />
                        <Row label={t("tree.plantingDate")} value={formatDate(tree.plantingDate, locale)} />
                        <Row
                          label={t("tree.location")}
                          value={`${tree.commune}، ${localisedName(tree.wilaya, locale)}`}
                          icon={<MapPin className="size-3.5" aria-hidden="true" />}
                        />
                        <Row label={t("tree.submittedAt")} value={formatDateTime(tree.createdAt, locale)} />
                        <Row label={t("tree.planter")} value={tree.user.name} />
                        {tree.publicLatitude != null && tree.publicLongitude != null ? (
                          <Row
                            label={t("tree.coordinates")}
                            value={`${tree.publicLatitude.toFixed(2)}, ${tree.publicLongitude.toFixed(2)}`}
                          />
                        ) : null}
                      </dl>

                      {tree.notes ? (
                        <div>
                          <p className="text-xs text-muted-foreground">{t("tree.notes")}</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm">{tree.notes}</p>
                        </div>
                      ) : null}

                      <ReviewPanel treeId={tree.id} locale={locale} />
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>

          <Pagination
            page={result.page}
            total={result.total}
            perPage={result.perPage}
            basePath={`/${locale}/admin/trees/pending`}
            baseParams={{}}
            t={t}
            dir={dir}
          />
        </>
      )}
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-1.5 truncate font-medium">
        {icon}
        {value}
      </dd>
    </div>
  );
}
