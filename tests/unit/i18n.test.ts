import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/config";
import { createTranslator, getMessages, interpolate } from "@/i18n/messages";
import { formatNumber } from "@/i18n/format";
import { WILAYAS } from "@/lib/reference/wilayas";

function flatten(node: unknown, prefix = ""): string[] {
  if (typeof node !== "object" || node === null) return [prefix];
  return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
    flatten(value, prefix ? `${prefix}.${key}` : key),
  );
}

describe("translation catalogues", () => {
  it("defines the same keys in every locale", () => {
    const [reference, ...rest] = LOCALES.map((locale) => flatten(getMessages(locale)).sort());
    for (const keys of rest) {
      expect(keys).toEqual(reference);
    }
  });

  it("resolves nested keys", () => {
    const t = createTranslator("fr");
    expect(t("campaignStatus.ACTIVE")).toBe("En cours");
  });

  it("falls back to the default locale rather than rendering nothing", () => {
    const t = createTranslator("en");
    expect(t("brand.name")).toBe("Algeria Green");
  });

  it("returns the key itself for an unknown lookup", () => {
    const t = createTranslator("ar");
    expect(t("does.not.exist")).toBe("does.not.exist");
  });
});

describe("interpolate", () => {
  it("substitutes named placeholders", () => {
    expect(interpolate("Page {page} of {total}", { page: 2, total: 9 })).toBe("Page 2 of 9");
  });

  it("leaves unknown placeholders untouched", () => {
    expect(interpolate("Hello {name}", {})).toBe("Hello {name}");
  });
});

describe("number formatting", () => {
  it("formats per locale", () => {
    expect(formatNumber(0, "en")).toBe("0");
    expect(formatNumber(1234, "en")).toBe("1,234");
    expect(typeof formatNumber(1234, "ar")).toBe("string");
  });
});

describe("wilaya reference data", () => {
  it("covers the 58 current wilayas with unique ids and codes", () => {
    expect(WILAYAS).toHaveLength(58);
    expect(new Set(WILAYAS.map((w) => w.id)).size).toBe(58);
    expect(new Set(WILAYAS.map((w) => w.code)).size).toBe(58);
  });

  it("names every wilaya in all three languages", () => {
    for (const wilaya of WILAYAS) {
      expect(wilaya.nameAr.length, wilaya.code).toBeGreaterThan(0);
      expect(wilaya.nameFr.length, wilaya.code).toBeGreaterThan(0);
      expect(wilaya.nameEn.length, wilaya.code).toBeGreaterThan(0);
    }
  });
});
