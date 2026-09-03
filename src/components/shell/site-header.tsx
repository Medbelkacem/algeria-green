import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import { createTranslator } from "@/i18n/messages";
import type { Locale } from "@/i18n/config";
import type { SessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose,
} from "@/components/ui/sheet";
import { BrandMark } from "@/components/shared/logo";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { NavLink } from "./nav-link";
import { PRIMARY_NAV } from "./nav-links";

export async function SiteHeader({
  locale,
  user,
  unreadCount,
}: {
  locale: Locale;
  user: SessionUser | null;
  unreadCount: number;
}) {
  const t = createTranslator(locale);
  const canAccessAdmin = hasPermission(user, "admin:access");

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href={`/${locale}`} className="shrink-0 rounded-lg" aria-label={t("brand.name")}>
          <BrandMark name={t("brand.name")} tagline={t("brand.nameLatin")} />
        </Link>

        <nav aria-label={t("nav.menu")} className="ms-4 hidden flex-1 items-center gap-1 lg:flex">
          {PRIMARY_NAV.map((item) => (
            <NavLink key={item.key} href={`/${locale}${item.href}`} exact={item.href === ""}>
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-1">
          <LanguageSwitcher locale={locale} label={t("nav.language")} />
          <ThemeToggle
            label={t("nav.theme")}
            toLight={t("nav.themeLight")}
            toDark={t("nav.themeDark")}
          />

          {user ? (
            <>
              <Link
                href={`/${locale}/dashboard/notifications`}
                className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}
                aria-label={t("nav.notifications")}
              >
                <Bell />
                {unreadCount > 0 ? (
                  <Badge
                    variant="destructive"
                    className="absolute -end-0.5 -top-0.5 h-5 min-w-5 justify-center px-1 text-[10px] tabular"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                ) : null}
              </Link>
              <UserMenu
                locale={locale}
                name={user.name}
                email={user.email}
                avatarUrl={user.avatarUrl}
                canAccessAdmin={canAccessAdmin}
                labels={{
                  dashboard: t("nav.dashboard"),
                  trees: t("dashboard.myTrees"),
                  settings: t("dashboard.settings"),
                  admin: t("nav.admin"),
                  signOut: t("nav.signOut"),
                  profile: t("nav.profile"),
                }}
              />
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href={`/${locale}/sign-in`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                {t("nav.signIn")}
              </Link>
              <Link href={`/${locale}/sign-up`} className={cn(buttonVariants({ size: "sm" }))}>
                {t("nav.signUp")}
              </Link>
            </div>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("nav.openMenu")}>
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="end" closeLabel={t("nav.closeMenu")}>
              <SheetHeader>
                <SheetTitle className="text-start text-base font-semibold">{t("nav.menu")}</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1" aria-label={t("nav.menu")}>
                {PRIMARY_NAV.map((item) => (
                  <SheetClose asChild key={item.key}>
                    <Link
                      href={`/${locale}${item.href}`}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-secondary"
                    >
                      <item.icon className="size-5 text-muted-foreground" aria-hidden="true" />
                      {t(`nav.${item.key}`)}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              {!user ? (
                <div className="mt-6 flex flex-col gap-2 border-t pt-6">
                  <SheetClose asChild>
                    <Link href={`/${locale}/sign-in`} className={cn(buttonVariants({ variant: "outline" }))}>
                      {t("nav.signIn")}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href={`/${locale}/sign-up`} className={cn(buttonVariants())}>
                      {t("nav.signUp")}
                    </Link>
                  </SheetClose>
                </div>
              ) : null}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
