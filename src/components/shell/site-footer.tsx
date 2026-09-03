import Link from "next/link";
import { createTranslator } from "@/i18n/messages";
import type { Locale } from "@/i18n/config";
import { BrandMark } from "@/components/shared/logo";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = createTranslator(locale);
  const year = new Date().getFullYear();

  const explore = [
    { href: `/${locale}/campaigns`, label: t("nav.campaigns") },
    { href: `/${locale}/plant`, label: t("nav.plant") },
    { href: `/${locale}/impact`, label: t("nav.impact") },
    { href: `/${locale}/map`, label: t("nav.map") },
    { href: `/${locale}/wilayas`, label: t("nav.wilayas") },
  ];
  const account = [
    { href: `/${locale}/sign-in`, label: t("nav.signIn") },
    { href: `/${locale}/sign-up`, label: t("nav.signUp") },
    { href: `/${locale}/dashboard`, label: t("nav.dashboard") },
  ];
  const legal = [
    { href: `/${locale}/privacy`, label: t("footer.privacy") },
    { href: `/${locale}/terms`, label: t("footer.terms") },
  ];

  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <BrandMark name={t("brand.name")} tagline={t("brand.nameLatin")} />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{t("footer.aboutBody")}</p>
            <p className="text-xs font-medium text-muted-foreground">{t("brand.slogan")}</p>
          </div>

          <FooterColumn title={t("footer.explore")} links={explore} />
          <FooterColumn title={t("footer.account")} links={account} />
          <FooterColumn title={t("footer.legal")} links={legal} />
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {t("brand.name")}. {t("footer.rights")}
          </p>
          <p>{t("footer.disclaimer")}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
