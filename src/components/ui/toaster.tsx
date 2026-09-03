"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster({ dir }: { dir: "rtl" | "ltr" }) {
  return (
    <Sonner
      dir={dir}
      position={dir === "rtl" ? "top-left" : "top-right"}
      toastOptions={{
        classNames: {
          toast: "bg-popover text-popover-foreground border shadow-lg rounded-lg",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}
