"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { localisedName } from "@/lib/display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export type FilterWilaya = { id: number; code: string; nameAr: string; nameFr: string; nameEn: string };

export type CampaignFilterLabels = {
  search: string;
  searchPlaceholder: string;
  wilaya: string;
  allWilayas: string;
  status: string;
  allStatuses: string;
  from: string;
  to: string;
  sort: string;
  sortOptions: { value: string; label: string }[];
  statusOptions: { value: string; label: string }[];
  apply: string;
  reset: string;
  filters: string;
};

const ALL = "__all__";

export function CampaignFilters({
  wilayas,
  locale,
  labels,
}: {
  wilayas: FilterWilaya[];
  locale: Locale;
  labels: CampaignFilterLabels;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = React.useState(false);

  const current = React.useMemo(
    () => ({
      q: searchParams.get("q") ?? "",
      wilayaId: searchParams.get("wilayaId") ?? ALL,
      status: searchParams.get("status") ?? ALL,
      from: searchParams.get("from") ?? "",
      to: searchParams.get("to") ?? "",
      sort: searchParams.get("sort") ?? "dateAsc",
    }),
    [searchParams],
  );

  const hasFilters =
    current.q || current.wilayaId !== ALL || current.status !== ALL || current.from || current.to;

  function submit(formData: FormData) {
    const params = new URLSearchParams();
    for (const key of ["q", "wilayaId", "status", "from", "to", "sort"] as const) {
      const value = String(formData.get(key) ?? "").trim();
      if (value && value !== ALL && !(key === "sort" && value === "dateAsc")) params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <form action={submit} className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Label htmlFor="campaign-q" className="sr-only">
            {labels.search}
          </Label>
          <Input
            id="campaign-q"
            name="q"
            type="search"
            defaultValue={current.q}
            placeholder={labels.searchPlaceholder}
            className="ps-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-controls="campaign-advanced-filters"
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            {labels.filters}
          </Button>
          <Button type="submit">{labels.apply}</Button>
        </div>
      </div>

      <div
        id="campaign-advanced-filters"
        hidden={!expanded}
        className="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="space-y-1.5">
          <Label htmlFor="campaign-wilaya">{labels.wilaya}</Label>
          <Select name="wilayaId" defaultValue={current.wilayaId}>
            <SelectTrigger id="campaign-wilaya">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{labels.allWilayas}</SelectItem>
              {wilayas.map((wilaya) => (
                <SelectItem key={wilaya.id} value={String(wilaya.id)}>
                  {wilaya.code} · {localisedName(wilaya, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="campaign-status">{labels.status}</Label>
          <Select name="status" defaultValue={current.status}>
            <SelectTrigger id="campaign-status">
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
          <Label htmlFor="campaign-from">{labels.from}</Label>
          <Input id="campaign-from" name="from" type="date" defaultValue={current.from} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="campaign-to">{labels.to}</Label>
          <Input id="campaign-to" name="to" type="date" defaultValue={current.to} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="campaign-sort">{labels.sort}</Label>
          <Select name="sort" defaultValue={current.sort}>
            <SelectTrigger id="campaign-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {labels.sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasFilters ? (
          <div className="sm:col-span-2 lg:col-span-5">
            <Button type="button" variant="ghost" size="sm" onClick={() => router.push(pathname)}>
              <X className="size-4" aria-hidden="true" />
              {labels.reset}
            </Button>
          </div>
        ) : null}
      </div>
    </form>
  );
}
