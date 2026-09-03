import * as React from "react";
import { cn } from "@/lib/utils";

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
    <div className={cn("rounded-xl border bg-card p-5 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("tabular text-3xl font-bold leading-none sm:text-4xl", toneClass)}>{value}</p>
          <p className="mt-2 truncate text-sm text-muted-foreground">{label}</p>
        </div>
        {icon ? (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary [&_svg]:size-5">
            {icon}
          </div>
        ) : null}
      </div>
      {hint ? <p className="mt-3 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
