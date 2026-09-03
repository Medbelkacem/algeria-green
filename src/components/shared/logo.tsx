import { cn } from "@/lib/utils";

/**
 * Original mark: a stylised leaf/crescent growing from a horizon line — a
 * quiet nod to the Algerian landscape without using any protected emblem.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-hidden="true"
      focusable="false"
      className={cn("size-8", className)}
    >
      <circle cx="16" cy="16" r="15" className="fill-primary-soft" />
      <path
        d="M16 26V15.5"
        className="stroke-primary"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 16.5c0-5 3.2-9 8-10.2.9 5.6-2.2 10.6-8 10.2Z"
        className="fill-primary"
      />
      <path
        d="M15.2 19.4c-3.6.3-6.6-2.6-7-6.8 3.9.4 6.7 3.1 7 6.8Z"
        className="fill-primary/65"
      />
    </svg>
  );
}

export function BrandMark({
  name,
  tagline,
  className,
}: {
  name: string;
  tagline?: string;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Logo />
      <span className="flex flex-col leading-none">
        <span className="text-base font-bold tracking-tight">{name}</span>
        {tagline ? (
          <span className="mt-0.5 text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {tagline}
          </span>
        ) : null}
      </span>
    </span>
  );
}
