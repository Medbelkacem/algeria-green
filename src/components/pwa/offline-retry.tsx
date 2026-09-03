"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OfflineRetry({ label }: { label: string }) {
  return (
    <Button onClick={() => window.location.reload()}>
      <RefreshCw className="size-4" aria-hidden="true" />
      {label}
    </Button>
  );
}
