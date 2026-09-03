"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const MapCanvas = dynamic(() => import("./map-canvas").then((mod) => mod.MapCanvas), {
  ssr: false,
  loading: () => <MapPlaceholder label="" />,
});

export type TreePoint = {
  publicId: string;
  lat: number;
  lng: number;
  wilayaId: number;
};

export type CampaignPoint = {
  id: string;
  slug: string;
  title: string;
  status: string;
  commune: string;
  lat: number;
  lng: number;
};

export type MapLabels = {
  trees: string;
  campaigns: string;
  layers: string;
  loading: string;
  noPoints: string;
  privacy: string;
  viewDetails: string;
  attribution: string;
};

function MapPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-[60vh] min-h-96 w-full items-center justify-center rounded-xl border bg-muted/40">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        {label}
      </span>
    </div>
  );
}

export function PlantingMap(props: {
  trees: TreePoint[];
  campaigns: CampaignPoint[];
  locale: string;
  labels: MapLabels;
  tileUrl: string;
}) {
  // `ssr: false` already defers the canvas to the browser, so no mounted flag
  // is needed; the dynamic loader renders the placeholder in the meantime.
  return <MapCanvas {...props} />;
}
