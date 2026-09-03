"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "dzg_theme";
const EVENT = "dzg:theme";

/**
 * The <html> class is the single source of truth — an inline script in the
 * document head applies it before first paint, so there is no flash and no
 * state to synchronise in an effect.
 */
function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function isDark() {
  return document.documentElement.classList.contains("dark");
}

export function ThemeToggle({
  label,
  toLight,
  toDark,
}: {
  label: string;
  toLight: string;
  toDark: string;
}) {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  function toggle() {
    const next = !isDark();
    document.documentElement.classList.toggle("dark", next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // Private browsing can block storage; the toggle still works for the session.
    }
    window.dispatchEvent(new Event(EVENT));
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      // The accessible name says what the button will do, not just its topic.
      aria-label={dark ? toLight : toDark}
      title={label}
      aria-pressed={dark}
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}

/** Applied before hydration so the first paint already has the right theme. */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("${STORAGE_KEY}");var d=s?s==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})();`;
