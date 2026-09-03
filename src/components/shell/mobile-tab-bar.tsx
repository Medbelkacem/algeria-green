"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Sprout, TentTree, User } from "lucide-react";
import { createTranslator } from "@/i18n/messages";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "home", href: "", icon: Home, exact: true },
  { key: "campaigns", href: "/campaigns", icon: TentTree, exact: false },
  { key: "plant", href: "/plant", icon: Sprout, exact: false, primary: true },
  { key: "impact", href: "/impact", icon: BarChart3, exact: false },
  { key: "profile", href: "/dashboard", icon: User, exact: false },
] as const;

/**
 * Bottom navigation for handhelds. Hidden from large screens, which use the
 * header navigation and, inside the dashboards, a sidebar.
 */
export function MobileTabBar({ locale, isAuthenticated }: { locale: Locale; isAuthenticated: boolean }) {
  const pathname = usePathname();
  const t = createTranslator(locale);

  return (
    <nav
      aria-label={t("nav.menu")}
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {TABS.map((tab) => {
          const href =
            tab.key === "profile" && !isAuthenticated ? `/${locale}/sign-in` : `/${locale}${tab.href}`;
          const active = tab.exact ? pathname === href : pathname.startsWith(href);
          const Icon = tab.icon;
          return (
            <li key={tab.key}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full transition-colors",
                    active && "bg-primary-soft",
                    "primary" in tab && tab.primary && !active && "bg-primary text-primary-foreground",
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="truncate">{t(`nav.${tab.key}`)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
