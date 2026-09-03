import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Inter, Cairo } from "next/font/google";
import "../globals.css";
import { LOCALES, LOCALE_META, isLocale, type Locale } from "@/i18n/config";
import { createTranslator } from "@/i18n/messages";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/current-user";
import { SiteHeader } from "@/components/shell/site-header";
import { SiteFooter } from "@/components/shell/site-footer";
import { MobileTabBar } from "@/components/shell/mobile-tab-bar";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { Toaster } from "@/components/ui/toaster";
import { THEME_INIT_SCRIPT } from "@/components/shell/theme-toggle";
import { TooltipProvider } from "@/components/ui/tooltip";
import { countUnread } from "@/services/notification.service";

const inter = Inter({ subsets: ["latin"], variable: "--font-app-sans", display: "swap" });
const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-app-arabic", display: "swap" });

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = createTranslator(locale);
  const baseUrl = env.appUrl;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: `${t("brand.name")} — ${t("brand.slogan")}`,
      template: `%s · ${t("brand.name")}`,
    },
    description: t("brand.description"),
    applicationName: t("brand.name"),
    manifest: "/manifest.webmanifest",
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: Object.fromEntries(
        LOCALES.map((l) => [LOCALE_META[l].htmlLang, `${baseUrl}/${l}`]),
      ),
    },
    openGraph: {
      type: "website",
      siteName: t("brand.name"),
      title: `${t("brand.name")} — ${t("brand.slogan")}`,
      description: t("brand.description"),
      url: `${baseUrl}/${locale}`,
      locale: LOCALE_META[locale].htmlLang.replace("-", "_"),
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("brand.name")} — ${t("brand.slogan")}`,
      description: t("brand.description"),
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: t("brand.name"),
    },
    icons: {
      icon: [
        { url: "/icons/icon.svg", type: "image/svg+xml" },
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7fbf8" },
    { media: "(prefers-color-scheme: dark)", color: "#13221b" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dir = LOCALE_META[locale].dir;
  const t = createTranslator(locale);

  const user = await getCurrentUser();
  const unreadCount = user && user.status === "ACTIVE" ? await countUnread(user.id) : 0;

  return (
    <html
      lang={LOCALE_META[locale].htmlLang}
      dir={dir}
      className={`${inter.variable} ${cairo.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        {/* Applies the stored theme before first paint, avoiding a flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          {t("nav.skipToContent")}
        </a>
        <TooltipProvider delayDuration={200}>
          <OfflineBanner locale={locale} message={t("pwa.offlineBanner")} backOnline={t("pwa.backOnline")} />
          <SiteHeader locale={locale} user={user} unreadCount={unreadCount} />
          <main id="main" className="flex-1 pb-20 lg:pb-0">
            {children}
          </main>
          <SiteFooter locale={locale} />
          <MobileTabBar locale={locale} isAuthenticated={Boolean(user)} />
          <InstallPrompt
            title={t("pwa.installTitle")}
            body={t("pwa.installBody")}
            install={t("pwa.install")}
            dismiss={t("pwa.dismiss")}
          />
        </TooltipProvider>
        <Toaster dir={dir} />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
