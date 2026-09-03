import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarDays, MapPin, Sprout, TentTree, User } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { formatDate } from "@/i18n/format";
import { localisedName, speciesLabel } from "@/lib/display";
import { env } from "@/lib/env";
import { TREE_PUBLIC_ID_PATTERN } from "@/lib/security/tokens";
import { getPublicTree } from "@/services/tree.service";
import { Container } from "@/components/shared/section";
import { QrPanel } from "@/components/shared/qr-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; publicId: string }>;
}): Promise<Metadata> {
  const { locale, publicId } = await params;
  if (!isLocale(locale)) return {};
  const t = createTranslator(locale);
  return {
    title: `${t("tree.publicTitle")} ${publicId}`,
    description: t("brand.description"),
  };
}

export default async function PublicTreePage({
  params,
}: {
  params: Promise<{ locale: string; publicId: string }>;
}) {
  const { locale: raw, publicId } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = createTranslator(locale);

  // Reject anything that is not shaped like a public identifier before querying.
  if (!TREE_PUBLIC_ID_PATTERN.test(publicId)) notFound();

  const tree = await getPublicTree(publicId);
  if (!tree) notFound();

  const facts = [
    { icon: Sprout, label: t("tree.species"), value: speciesLabel(tree.species, tree.speciesOther, locale) },
    { icon: CalendarDays, label: t("tree.plantingDate"), value: formatDate(tree.plantingDate, locale) },
    {
      icon: MapPin,
      label: t("tree.location"),
      value: `${tree.commune}، ${localisedName(tree.wilaya, locale)}`,
    },
    ...(tree.campaign
      ? [{ icon: TentTree, label: t("tree.campaign"), value: tree.campaign.title }]
      : [{ icon: TentTree, label: t("tree.campaign"), value: t("tree.individual") }]),
    {
      icon: User,
      label: t("tree.planter"),
      value: tree.planter ? tree.planter.name : t("tree.anonymous"),
    },
  ];

  return (
    <Container className="max-w-4xl py-8 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-6">
          <header className="space-y-3">
            <Badge variant="success">
              <BadgeCheck aria-hidden="true" />
              {t("treeStatus.VERIFIED")}
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("tree.publicTitle")}</h1>
            <p className="font-mono text-sm text-muted-foreground" dir="ltr">
              {tree.publicId}
            </p>
          </header>

          {tree.photoUrl ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border bg-muted">
              <Image src={tree.photoUrl} alt="" fill sizes="(max-width: 1024px) 100vw, 640px" className="object-cover" />
            </div>
          ) : null}

          <Card>
            <CardContent className="p-0">
              <dl className="divide-y">
                {facts.map((fact) => (
                  <div key={fact.label} className="flex items-start gap-3 p-4">
                    <fact.icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                      <dd className="text-sm font-medium">
                        {tree.campaign && fact.label === t("tree.campaign") ? (
                          <Link
                            href={`/${locale}/campaigns/${tree.campaign.slug}`}
                            className="text-primary hover:underline"
                          >
                            {fact.value}
                          </Link>
                        ) : (
                          fact.value
                        )}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <p className="text-xs leading-relaxed text-muted-foreground">{t("map.privacyNote")}</p>
        </div>

        <aside>
          <QrPanel
            value={`${env.appUrl}/${locale}/tree/${tree.publicId}`}
            title={t("misc.shareTree")}
            copyLabel={t("actions.copy")}
            copiedLabel={t("actions.copied")}
          />
        </aside>
      </div>
    </Container>
  );
}
