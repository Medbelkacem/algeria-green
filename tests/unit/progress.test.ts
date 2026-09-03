import { describe, expect, it } from "vitest";
import { clamp, progressPercent, slugify } from "@/lib/utils";

describe("progressPercent", () => {
  it("returns the rounded percentage of the target reached", () => {
    expect(progressPercent(820, 1000)).toBe(82);
    expect(progressPercent(1, 3)).toBe(33);
  });

  it("returns 0 when nothing has been verified", () => {
    expect(progressPercent(0, 1000)).toBe(0);
  });

  it("never divides by zero or a negative target", () => {
    expect(progressPercent(50, 0)).toBe(0);
    expect(progressPercent(50, -10)).toBe(0);
    expect(progressPercent(50, Number.NaN)).toBe(0);
  });

  it("caps at 100 when the target is exceeded", () => {
    expect(progressPercent(1500, 1000)).toBe(100);
  });

  it("treats negative or invalid achievement as zero", () => {
    expect(progressPercent(-5, 100)).toBe(0);
    expect(progressPercent(Number.NaN, 100)).toBe(0);
  });
});

describe("slugify", () => {
  it("produces a url-safe slug", () => {
    expect(slugify("Campagne de reboisement — Blida 2026")).toBe("campagne-de-reboisement-blida-2026");
  });

  it("never returns an empty slug", () => {
    expect(slugify("!!!")).toBe("campaign");
  });
});

describe("clamp", () => {
  it("bounds a value", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});
