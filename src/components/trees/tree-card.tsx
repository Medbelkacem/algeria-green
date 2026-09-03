import Image from "next/image";
import Link from "next/link";
import { MapPin, Sprout } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { formatDateShort } from "@/i18n/format";
import { localisedName, speciesLabel } from "@/lib/display";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PublicTreeSummary = {
  publicId: string;
  plantingDate: Date;
  commune: string;
  photoUrl: string | null;
  species: { slug: string; nameAr: string; nameFr: string; nameEn: string } | null;
  speciesOther: string | null;
  wilaya: { nameAr: string; nameFr: string; nameEn: string };
  planterName: string | null;
};

export function VerifiedTreeCard({ tree, locale }: { tree: PublicTreeSummary; locale: Locale }) {
  const t = createTranslator(locale);

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/${locale}/tree/${tree.publicId}`} className="block">
        <div className="relative aspect-square w-full overflow-hidden bg-primary-soft">
          {tree.photoUrl ? (
            <Image
              src={tree.photoUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex size-full items-center justify-center" aria-hidden="true">
              <Sprout className="size-10 text-primary/35" />
            </div>
          )}
        </div>
        <div className="space-y-1.5 p-3.5">
          <p className="truncate text-sm font-semibold">
            {speciesLabel(tree.species, tree.speciesOther, locale)}
          </p>
          <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            {tree.commune}، {localisedName(tree.wilaya, locale)}
          </p>
          <p className="tabular text-xs text-muted-foreground">{formatDateShort(tree.plantingDate, locale)}</p>
          <Badge variant="muted" className="font-mono text-[10px]">
            {tree.publicId}
          </Badge>
          {tree.planterName ? (
            <p className="truncate text-xs text-muted-foreground">{tree.planterName}</p>
          ) : (
            <p className="truncate text-xs text-muted-foreground">{t("tree.anonymous")}</p>
          )}
        </div>
      </Link>
    </Card>
  );
}
