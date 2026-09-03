import { describe, expect, it } from "vitest";
import { isWithinAlgeria, toPublicCoordinates, wilayaCentroid } from "@/lib/security/geo";

describe("toPublicCoordinates", () => {
  it("coarsens exact coordinates to roughly a kilometre", () => {
    const result = toPublicCoordinates(36.752887, 3.042048);
    expect(result.publicLatitude).toBe(36.75);
    expect(result.publicLongitude).toBe(3.04);
  });

  it("never echoes the precise input back", () => {
    const lat = 36.7528871234;
    const result = toPublicCoordinates(lat, 3.0420481234);
    expect(result.publicLatitude).not.toBe(lat);
  });

  it("returns nulls when no coordinates were shared", () => {
    expect(toPublicCoordinates(null, null)).toEqual({ publicLatitude: null, publicLongitude: null });
    expect(toPublicCoordinates(36.75, null)).toEqual({ publicLatitude: null, publicLongitude: null });
  });

  it("discards coordinates outside Algeria", () => {
    expect(toPublicCoordinates(48.85, 2.35)).toEqual({ publicLatitude: null, publicLongitude: null });
  });
});

describe("isWithinAlgeria", () => {
  it("accepts points inside the national bounding box", () => {
    expect(isWithinAlgeria(36.75, 3.04)).toBe(true);
    expect(isWithinAlgeria(22.79, 5.53)).toBe(true);
  });

  it("rejects points outside it", () => {
    expect(isWithinAlgeria(51.5, -0.12)).toBe(false);
  });
});

describe("wilayaCentroid", () => {
  it("returns a fallback position for every seeded wilaya", () => {
    for (let id = 1; id <= 58; id += 1) {
      const centroid = wilayaCentroid(id);
      expect(centroid, `wilaya ${id}`).not.toBeNull();
      expect(isWithinAlgeria(centroid![0], centroid![1]), `wilaya ${id} in bounds`).toBe(true);
    }
  });

  it("returns null for an unknown wilaya", () => {
    expect(wilayaCentroid(999)).toBeNull();
  });
});
