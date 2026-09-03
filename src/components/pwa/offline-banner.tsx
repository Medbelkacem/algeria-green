"use client";

import * as React from "react";
import { WifiOff } from "lucide-react";
import type { Locale } from "@/i18n/config";

/**
 * Truthful connection state. It never claims work was saved while offline —
 * it only tells the user what they can and cannot do right now.
 */
export function OfflineBanner({
  message,
}: {
  locale: Locale;
  message: string;
  backOnline: string;
}) {
  const [offline, setOffline] = React.useState(false);

  React.useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 bg-warning px-4 py-2 text-center text-xs font-medium text-warning-foreground"
    >
      <WifiOff className="size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
