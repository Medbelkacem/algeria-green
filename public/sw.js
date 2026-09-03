/**
 * Algeria Green service worker.
 *
 * Caching strategy
 *  - App shell + icons: precached on install.
 *  - Navigations: network-first, falling back to the cached page and then to
 *    the offline page. This keeps statistics fresh whenever the network works.
 *  - Static build assets (/_next/static): cache-first, they are immutable.
 *  - Images: stale-while-revalidate, capped.
 *
 * Mutations are never queued or replayed. A POST that cannot reach the server
 * fails and the UI says so — the app never pretends a submission succeeded.
 */
const VERSION = "v1";
const SHELL_CACHE = `dzg-shell-${VERSION}`;
const PAGE_CACHE = `dzg-pages-${VERSION}`;
const ASSET_CACHE = `dzg-assets-${VERSION}`;
const IMAGE_CACHE = `dzg-images-${VERSION}`;
const KNOWN_CACHES = [SHELL_CACHE, PAGE_CACHE, ASSET_CACHE, IMAGE_CACHE];

const OFFLINE_PAGES = ["/ar/offline", "/fr/offline", "/en/offline"];
const PRECACHE = [...OFFLINE_PAGES, "/manifest.webmanifest", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !KNOWN_CACHES.includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function offlineFallbackFor(url) {
  const segment = url.pathname.split("/")[1];
  const locale = ["ar", "fr", "en"].includes(segment) ? segment : "ar";
  return `/${locale}/offline`;
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Authenticated and mutating surfaces must never be served from a cache.
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok && !url.pathname.includes("/dashboard") && !url.pathname.includes("/admin")) {
            const cache = await caches.open(PAGE_CACHE);
            cache.put(request, response.clone());
            trimCache(PAGE_CACHE, 60);
          }
          return response;
        } catch {
          const cached = await caches.match(request, { ignoreSearch: true });
          if (cached) return cached;
          const fallback = await caches.match(offlineFallbackFor(url));
          return (
            fallback ??
            new Response("Offline", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } })
          );
        }
      })(),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(ASSET_CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
          }),
      ),
    );
    return;
  }

  if (request.destination === "image") {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
              trimCache(IMAGE_CACHE, 80);
            }
            return response;
          })
          .catch(() => cached);
        return cached ?? network;
      }),
    );
  }
});
