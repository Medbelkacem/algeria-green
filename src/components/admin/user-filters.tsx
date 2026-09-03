"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";

export function UserFilters({
  labels,
}: {
  labels: {
    search: string;
    searchPlaceholder: string;
    role: string;
    allRoles: string;
    status: string;
    allStatuses: string;
    apply: string;
    reset: string;
    roleOptions: { value: string; label: string }[];
    statusOptions: { value: string; label: string }[];
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function submit(formData: FormData) {
    const params = new URLSearchParams();
    for (const key of ["q", "role", "status"] as const) {
      const value = String(formData.get(key) ?? "").trim();
      if (value && value !== ALL) params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const hasFilters = ["q", "role", "status"].some((key) => searchParams.get(key));

  return (
    <form action={submit} className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_auto_auto_auto]">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Label htmlFor="user-q" className="sr-only">
          {labels.search}
        </Label>
        <Input id="user-q" name="q" type="search" defaultValue={searchParams.get("q") ?? ""}
          placeholder={labels.searchPlaceholder} className="ps-9" />
      </div>

      <div className="min-w-40">
        <Label htmlFor="user-role" className="sr-only">
          {labels.role}
        </Label>
        <Select name="role" defaultValue={searchParams.get("role") ?? ALL}>
          <SelectTrigger id="user-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{labels.allRoles}</SelectItem>
            {labels.roleOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-36">
        <Label htmlFor="user-status" className="sr-only">
          {labels.status}
        </Label>
        <Select name="status" defaultValue={searchParams.get("status") ?? ALL}>
          <SelectTrigger id="user-status">
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

      <div className="flex gap-2">
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
