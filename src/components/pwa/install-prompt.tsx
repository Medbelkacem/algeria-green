"use client";

import * as React from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "dzg_install_dismissed";

/**
 * Shown only when the browser actually offers installation. Nothing is
 * simulated: without a real `beforeinstallprompt` event the card never appears.
 */
export function InstallPrompt({
  title,
  body,
  install,
  dismiss,
}: {
  title: string;
  body: string;
  install: string;
  dismiss: string;
}) {
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setVisible(false));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !deferred) return null;

  return (
    <div className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-sm rounded-xl border bg-popover p-4 shadow-xl lg:bottom-6 lg:end-6 lg:start-auto lg:mx-0">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Download className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{body}</p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await deferred.prompt();
                await deferred.userChoice;
                setVisible(false);
              }}
            >
              {install}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                window.localStorage.setItem(DISMISS_KEY, "1");
                setVisible(false);
              }}
            >
              {dismiss}
            </Button>
          </div>
        </div>
        <button
          type="button"
          aria-label={dismiss}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          onClick={() => setVisible(false)}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
