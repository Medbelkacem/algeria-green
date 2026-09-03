"use client";

import * as React from "react";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { CampaignPoint, MapLabels, TreePoint } from "./planting-map";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const ALGERIA_CENTER: [number, number] = [28.5, 2.5];

function icon(kind: "tree" | "campaign", count?: number) {
  const isCluster = typeof count === "number" && count > 1;
  const size = isCluster ? (count > 99 ? 44 : count > 9 ? 38 : 32) : 26;
  const bg = kind === "tree" ? "#0b5c39" : "#b77d16";
  const label = isCluster ? (count > 999 ? "999+" : String(count)) : "";

  return L.divIcon({
    className: "",
    html: `<span style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:${bg};color:#fff;font:600 ${isCluster ? 12 : 10}px system-ui;border:2px solid rgba(255,255,255,.9);box-shadow:0 1px 4px rgba(0,0,0,.35)">${label}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

type Cluster<T> = { lat: number; lng: number; items: T[] };

/**
 * Grid clustering keyed on the current zoom level. Points are already coarse
 * (public coordinates), so a simple grid is both sufficient and cheap.
 */
function cluster<T extends { lat: number; lng: number }>(points: T[], zoom: number): Cluster<T>[] {
  const cellSize = zoom >= 10 ? 0.02 : zoom >= 8 ? 0.08 : zoom >= 6 ? 0.3 : 1;
  const buckets = new Map<string, Cluster<T>>();

  for (const point of points) {
    const key = `${Math.floor(point.lat / cellSize)}:${Math.floor(point.lng / cellSize)}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.items.push(point);
      bucket.lat = (bucket.lat * (bucket.items.length - 1) + point.lat) / bucket.items.length;
      bucket.lng = (bucket.lng * (bucket.items.length - 1) + point.lng) / bucket.items.length;
    } else {
      buckets.set(key, { lat: point.lat, lng: point.lng, items: [point] });
    }
  }
  return Array.from(buckets.values());
}

function ZoomWatcher({ onZoom }: { onZoom: (zoom: number) => void }) {
  const map = useMap();
  React.useEffect(() => {
    const handler = () => onZoom(map.getZoom());
    handler();
    map.on("zoomend", handler);
    return () => {
      map.off("zoomend", handler);
    };
  }, [map, onZoom]);
  return null;
}

export function MapCanvas({
  trees,
  campaigns,
  locale,
  labels,
  tileUrl,
}: {
  trees: TreePoint[];
  campaigns: CampaignPoint[];
  locale: string;
  labels: MapLabels;
  tileUrl: string;
}) {
  const [zoom, setZoom] = React.useState(5);
  const [showTrees, setShowTrees] = React.useState(true);
  const [showCampaigns, setShowCampaigns] = React.useState(true);

  const treeClusters = React.useMemo(() => (showTrees ? cluster(trees, zoom) : []), [trees, zoom, showTrees]);
  const campaignClusters = React.useMemo(
    () => (showCampaigns ? cluster(campaigns, zoom) : []),
    [campaigns, zoom, showCampaigns],
  );

  return (
    <div className="space-y-3">
      <fieldset className="flex flex-wrap items-center gap-5 rounded-lg border bg-card px-4 py-3">
        <legend className="sr-only">{labels.layers}</legend>
        <div className="flex items-center gap-2">
          <Checkbox id="layer-trees" checked={showTrees} onCheckedChange={(v) => setShowTrees(v === true)} />
          <Label htmlFor="layer-trees" className="font-normal">
            <span className="size-3 rounded-full bg-[#0b5c39]" aria-hidden="true" />
            {labels.trees} ({trees.length})
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="layer-campaigns"
            checked={showCampaigns}
            onCheckedChange={(v) => setShowCampaigns(v === true)}
          />
          <Label htmlFor="layer-campaigns" className="font-normal">
            <span className="size-3 rounded-full bg-[#b77d16]" aria-hidden="true" />
            {labels.campaigns} ({campaigns.length})
          </Label>
        </div>
      </fieldset>

      <div className="relative h-[60vh] min-h-96 w-full overflow-hidden rounded-xl border">
        <MapContainer
          center={ALGERIA_CENTER}
          zoom={5}
          minZoom={4}
          maxZoom={14}
          scrollWheelZoom
          className="size-full"
        >
          <TileLayer url={tileUrl} attribution={labels.attribution} />
          <ZoomWatcher onZoom={setZoom} />

          {treeClusters.map((group, index) => (
            <Marker
              key={`tree-${index}-${group.lat}-${group.lng}`}
              position={[group.lat, group.lng]}
              icon={icon("tree", group.items.length)}
            >
              <Popup>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">
                    {labels.trees}: {group.items.length}
                  </p>
                  {group.items.length === 1 ? (
                    <Link
                      href={`/${locale}/tree/${group.items[0].publicId}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {group.items[0].publicId}
                    </Link>
                  ) : null}
                  <p className="text-xs opacity-70">{labels.privacy}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {campaignClusters.map((group, index) => (
            <Marker
              key={`campaign-${index}-${group.lat}-${group.lng}`}
              position={[group.lat, group.lng]}
              icon={icon("campaign", group.items.length)}
            >
              <Popup>
                <div className="space-y-1.5 text-sm">
                  {group.items.slice(0, 5).map((campaign) => (
                    <p key={campaign.id}>
                      <Link
                        href={`/${locale}/campaigns/${campaign.slug}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {campaign.title}
                      </Link>
                      <span className="block text-xs opacity-70">{campaign.commune}</span>
                    </p>
                  ))}
                  {group.items.length > 5 ? (
                    <p className="text-xs opacity-70">+{group.items.length - 5}</p>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {trees.length === 0 && campaigns.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-muted/25 p-4 text-center text-sm text-muted-foreground">
          {labels.noPoints}
        </p>
      ) : null}
    </div>
  );
}
