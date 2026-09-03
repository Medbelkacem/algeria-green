"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";

export function TreeFilters({
  campaigns,
  labels,
}: {
  campaigns: { id: string; title: string }[];
  labels: {
    status: string;
    allStatuses: string;
    campaign: string;
    allCampaigns: string;
    apply: string;
    reset: string;
    statusOptions: { value: string; label: string }[];
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function submit(formData: FormData) {
    const params = new URLSearchParams();
    for (const key of ["status", "campaignId"] as const) {
      const value = String(formData.get(key) ?? "");
      if (value && value !== ALL) params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const hasFilters = Boolean(searchParams.get("status") || searchParams.get("campaignId"));

  return (
    <form action={submit} className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_1fr_auto]">
      <div className="space-y-1.5">
        <Label htmlFor="tree-status">{labels.status}</Label>
        <Select name="status" defaultValue={searchParams.get("status") ?? ALL}>
          <SelectTrigger id="tree-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{labels.allStatuses}</SelectItem>
            {labels.statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tree-campaign">{labels.campaign}</Label>
        <Select name="campaignId" defaultValue={searchParams.get("campaignId") ?? ALL}>
          <SelectTrigger id="tree-campaign">
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

      <div className="flex items-end gap-2">
        <Button type="submit">{labels.apply}</Button>
        {hasFilters ? (
          <Button type="button" variant="ghost" size="icon" onClick={() => router.push(pathname)} aria-label={labels.reset}>
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
    </form>
  );
}
