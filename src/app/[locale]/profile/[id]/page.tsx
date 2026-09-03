import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, MapPin, TentTree, TreePine, UserRound } from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { formatDate, formatNumber } from "@/i18n/format";
import { localisedName } from "@/lib/display";
import { getPublicProfile } from "@/services/user.service";
import { Container } from "@/components/shared/section";
import { StatCard } from "@/components/shared/stat-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isLocale(locale)) return {};
  const profile = await getPublicProfile(id);
  if (!profile) return { title: createTranslator(locale)("profile.notFound"), robots: { index: false } };
  return { title: profile.name };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const t = createTranslator(locale);

  // Returns null for a private profile, so nothing leaks either way.
  const profile = await getPublicProfile(id);
  if (!profile) notFound();

  const initials = profile.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <Container className="max-w-3xl py-8 sm:py-12">
      <header className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-start">
        <Avatar className="size-20">
          {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt="" /> : null}
          <AvatarFallback className="text-xl">{initials || <UserRound />}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
          <p className="tabular text-sm text-muted-foreground">
            {t("profile.joined", { date: formatDate(profile.joinedAt, locale) })}
          </p>
          {profile.wilaya ? (
            <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
              <MapPin className="size-4" aria-hidden="true" />
              {localisedName(profile.wilaya, locale)}
            </p>
          ) : null}
        </div>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          value={formatNumber(profile.stats.treesTotal, locale)}
          label={t("profile.treesPlanted")}
          icon={<TreePine />}
        />
        <StatCard
          value={formatNumber(profile.stats.verified, locale)}
          label={t("profile.verifiedTrees")}
          icon={<CheckCircle2 />}
          tone="success"
        />
        <StatCard
          value={formatNumber(profile.stats.campaigns, locale)}
          label={t("profile.campaignsJoined")}
          icon={<TentTree />}
        />
      </div>
    </Container>
  );
}
