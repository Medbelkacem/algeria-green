import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A single figure with its label. Marked up as a description list so assistive
 * technology reads it as "verified trees: 0" rather than two loose paragraphs.
 */
export function StatCard({
  value,
  label,
  icon,
  hint,
  className,
  tone = "default",
}: {
  value: string;
  label: string;
  icon?: React.ReactNode;
  hint?: string;
  className?: string;
  tone?: "default" | "primary" | "warning" | "success" | "destructive";
}) {
  const toneClass = {
    default: "text-foreground",
    primary: "text-primary",
    warning: "text-warning",
    success: "text-success",
    destructive: "text-destructive",
  }[tone];

  return (
    <dl className={cn("rounded-xl border bg-card p-5 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <dd className={cn("tabular text-3xl font-bold leading-none sm:text-4xl", toneClass)}>{value}</dd>
          <dt className="mt-2 truncate text-sm text-muted-foreground">{label}</dt>
        </div>
        {icon ? (
          <div
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary [&_svg]:size-5"
          >
            {icon}
          </div>
        ) : null}
      </div>
      {hint ? <p className="mt-3 text-xs text-muted-foreground">{hint}</p> : null}
    </dl>
  );
}
