"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";

export function MapFilters({
  wilayas,
  campaigns,
  labels,
}: {
  locale: Locale;
  wilayas: { id: number; code: string; name: string }[];
  campaigns: { id: string; title: string }[];
  labels: {
    wilaya: string;
    allWilayas: string;
    campaign: string;
    allCampaigns: string;
    from: string;
    to: string;
    apply: string;
    reset: string;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function submit(formData: FormData) {
    const params = new URLSearchParams();
    for (const key of ["wilayaId", "campaignId", "from", "to"] as const) {
      const value = String(formData.get(key) ?? "").trim();
      if (value && value !== ALL) params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const hasFilters = ["wilayaId", "campaignId", "from", "to"].some((key) => searchParams.get(key));

  return (
    <form action={submit} className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="space-y-1.5">
        <Label htmlFor="map-wilaya">{labels.wilaya}</Label>
        <Select name="wilayaId" defaultValue={searchParams.get("wilayaId") ?? ALL}>
          <SelectTrigger id="map-wilaya">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{labels.allWilayas}</SelectItem>
            {wilayas.map((wilaya) => (
              <SelectItem key={wilaya.id} value={String(wilaya.id)}>
                {wilaya.code} · {wilaya.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="map-campaign">{labels.campaign}</Label>
        <Select name="campaignId" defaultValue={searchParams.get("campaignId") ?? ALL}>
          <SelectTrigger id="map-campaign">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{labels.allCampaigns}</SelectItem>
            {campaigns.map((campaign) => (
              <SelectItem key={campaign.id} value={campaign.id}>
                {campaign.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="map-from">{labels.from}</Label>
        <Input id="map-from" name="from" type="date" defaultValue={searchParams.get("from") ?? ""} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="map-to">{labels.to}</Label>
        <Input id="map-to" name="to" type="date" defaultValue={searchParams.get("to") ?? ""} />
      </div>

      <div className="flex items-end gap-2">
        <Button type="submit" className="flex-1">
          {labels.apply}
        </Button>
        {hasFilters ? (
          <Button type="button" variant="ghost" size="icon" onClick={() => router.push(pathname)} aria-label={labels.reset}>
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
    </form>
  );
}
