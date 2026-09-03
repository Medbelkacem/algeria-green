import { WILAYA_CENTROIDS } from "@/lib/reference/wilayas";

export const ALGERIA_BOUNDS = {
  minLat: 18.5,
  maxLat: 37.5,
  minLng: -9.0,
  maxLng: 12.5,
};

export function isWithinAlgeria(lat: number, lng: number): boolean {
  return (
    lat >= ALGERIA_BOUNDS.minLat &&
    lat <= ALGERIA_BOUNDS.maxLat &&
    lng >= ALGERIA_BOUNDS.minLng &&
    lng <= ALGERIA_BOUNDS.maxLng
  );
}

/**
 * Coarsens exact coordinates before they can ever reach a public surface.
 * Rounding to 2 decimals keeps a point accurate to roughly a kilometre —
 * enough for a map, not enough to identify a home or a private plot.
 */
const PUBLIC_PRECISION = 2;

export function toPublicCoordinates(
  lat: number | null | undefined,
  lng: number | null | undefined,
): { publicLatitude: number | null; publicLongitude: number | null } {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { publicLatitude: null, publicLongitude: null };
  }
  if (!isWithinAlgeria(lat, lng)) {
    return { publicLatitude: null, publicLongitude: null };
  }
  const factor = 10 ** PUBLIC_PRECISION;
  return {
    publicLatitude: Math.round(lat * factor) / factor,
    publicLongitude: Math.round(lng * factor) / factor,
  };
}

/** Fallback map position when a contributor shared no coordinates at all. */
export function wilayaCentroid(wilayaId: number): [number, number] | null {
  return WILAYA_CENTROIDS[wilayaId] ?? null;
}
