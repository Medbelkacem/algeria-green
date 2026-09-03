"use client";

import * as React from "react";
import Link from "next/link";
import { Search, TentTree, TreePine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export type WilayaItem = {
  code: string;
  name: string;
  href: string;
  trees: string;
  campaigns: string;
  hasActivity: boolean;
};

/**
 * The 58 wilayas are a fixed reference list, so filtering them on the client
 * is cheap and instant. Every other list in the app paginates server-side.
 */
export function WilayaSearch({
  items,
  labels,
}: {
  items: WilayaItem[];
  labels: {
    search: string;
    placeholder: string;
    trees: string;
    campaigns: string;
    empty: string;
    emptyHint: string;
  };
}) {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (item) => item.name.toLowerCase().includes(needle) || item.code.includes(needle),
    );
  }, [items, query]);

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Label htmlFor="wilaya-search" className="sr-only">
          {labels.search}
        </Label>
        <Input
          id="wilaya-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={labels.placeholder}
          className="ps-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={labels.empty} description={labels.emptyHint} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <li key={item.code}>
              <Link
                href={item.href}
                className={cn(
                  "flex h-full flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary-soft/30",
                  !item.hasActivity && "opacity-70",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{item.name}</span>
                  <span className="tabular shrink-0 rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                    {item.code}
                  </span>
                </div>
                <dl className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <TreePine className="size-3.5" aria-hidden="true" />
                    <dt className="sr-only">{labels.trees}</dt>
                    <dd className="tabular font-medium text-foreground">{item.trees}</dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TentTree className="size-3.5" aria-hidden="true" />
                    <dt className="sr-only">{labels.campaigns}</dt>
                    <dd className="tabular font-medium text-foreground">{item.campaigns}</dd>
                  </div>
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
