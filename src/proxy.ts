import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE, isLocale } from "@/i18n/config";

const PUBLIC_FILE = /\.[^/]+$/;

function negotiateLocale(request: NextRequest): string {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;

  const header = request.headers.get("accept-language");
  if (header) {
    const ranked = header
      .split(",")
      .map((part) => {
        const [tag, q] = part.trim().split(";q=");
        return { tag: tag.split("-")[0].toLowerCase(), q: q ? Number(q) : 1 };
      })
      .sort((a, b) => b.q - a.q);
    for (const { tag } of ranked) {
      if (isLocale(tag)) return tag;
    }
  }
  return DEFAULT_LOCALE;
}

/**
 * Locale routing only. Authorisation is deliberately NOT enforced here —
 * every protected page and server action re-checks the session server-side,
 * so a bypass of this layer grants nothing.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/uploads") ||
    pathname === "/sw.js" ||
    pathname === "/manifest.webmanifest" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const first = pathname.split("/")[1];
  if (LOCALES.includes(first as (typeof LOCALES)[number])) {
    // Forwarded on the request so server components (notably not-found.tsx,
    // which cannot read route params) can still resolve the language.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-dzg-locale", first);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("x-dzg-locale", first);
    return response;
  }

  const locale = negotiateLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons|uploads|sw\\.js|manifest\\.webmanifest).*)"],
};
