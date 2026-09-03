"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // A failed registration must never break the page; the app simply
        // runs without offline support.
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}

/**
 * Cached pages include the signed-in header (name, avatar). Dropping the page
 * cache on sign-out stops that chrome reappearing offline on a shared device.
 */
export async function clearCachedPages() {
  if (typeof caches === "undefined") return;
  try {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("dzg-pages-")).map((key) => caches.delete(key)));
  } catch {
    // Cache access can be denied; sign-out must never fail because of it.
  }
}
