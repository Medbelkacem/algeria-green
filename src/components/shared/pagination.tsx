import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Translator } from "@/i18n/messages";

/**
 * Server-rendered pagination: every page is a real URL, so it works without
 * JavaScript and is crawlable.
 */
export function Pagination({
  page,
  total,
  perPage,
  baseParams,
  basePath,
  t,
  dir,
}: {
  page: number;
  total: number;
  perPage: number;
  baseParams: Record<string, string | undefined>;
  basePath: string;
  t: Translator;
  dir: "rtl" | "ltr";
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) return null;

  const href = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(baseParams)) {
      if (value != null && value !== "") params.set(key, value);
    }
    if (target > 1) params.set("page", String(target));
    else params.delete("page");
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const from = (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);

  const windowStart = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => windowStart + i).filter(
    (p) => p >= 1 && p <= totalPages,
  );

  const PrevIcon = dir === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <nav
      aria-label={t("pagination.page", { page, total: totalPages })}
      className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-between"
    >
      <p className="tabular text-sm text-muted-foreground">
        {t("pagination.showing", { from, to, total })}
      </p>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link
            href={href(page - 1)}
            className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}
            aria-label={t("actions.previous")}
            rel="prev"
          >
            <PrevIcon />
          </Link>
        ) : (
          <span className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "pointer-events-none opacity-40")} aria-hidden="true">
            <PrevIcon />
          </span>
        )}

        {pages.map((p) => (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: p === page ? "default" : "ghost", size: "icon-sm" }),
              "tabular",
            )}
          >
            {p}
          </Link>
        ))}

        {page < totalPages ? (
          <Link
            href={href(page + 1)}
            className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}
            aria-label={t("actions.next")}
            rel="next"
          >
            <NextIcon />
          </Link>
        ) : (
          <span className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "pointer-events-none opacity-40")} aria-hidden="true">
            <NextIcon />
          </span>
        )}
      </div>
    </nav>
  );
}
