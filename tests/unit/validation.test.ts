import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";
import { treeReviewSchema, treeSubmissionSchema } from "@/lib/validation/tree";
import { campaignInputSchema } from "@/lib/validation/campaign";
import { hasAllowedExtension, sniffImageType } from "@/lib/validation/upload";

const validTree = {
  speciesId: "1",
  plantingDate: "2026-01-15",
  wilayaId: "16",
  commune: "Bab Ezzouar",
};

describe("signUpSchema", () => {
  it("accepts a well-formed registration", () => {
    const result = signUpSchema.safeParse({
      name: "Amina B.",
      email: "Amina@Example.DZ",
      password: "greenalgeria1",
      confirmPassword: "greenalgeria1",
      wilayaId: "16",
      locale: "ar",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("amina@example.dz");
  });

  it("rejects mismatched passwords", () => {
    const result = signUpSchema.safeParse({
      name: "Amina", email: "a@b.dz", password: "greenalgeria1",
      confirmPassword: "greenalgeria2", wilayaId: "", locale: "ar",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password with no digit", () => {
    const result = signUpSchema.safeParse({
      name: "Amina", email: "a@b.dz", password: "greenalgeria",
      confirmPassword: "greenalgeria", wilayaId: "", locale: "ar",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown wilaya", () => {
    const result = signUpSchema.safeParse({
      name: "Amina", email: "a@b.dz", password: "greenalgeria1",
      confirmPassword: "greenalgeria1", wilayaId: "99", locale: "ar",
    });
    expect(result.success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("normalises the email address", () => {
    const result = signInSchema.safeParse({ email: "  USER@Example.DZ ", password: "x" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("user@example.dz");
  });
});

describe("treeSubmissionSchema", () => {
  it("accepts a minimal individual submission", () => {
    expect(treeSubmissionSchema.safeParse(validTree).success).toBe(true);
  });

  it("rejects a planting date in the future", () => {
    const future = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const result = treeSubmissionSchema.safeParse({ ...validTree, plantingDate: future });
    expect(result.success).toBe(false);
  });

  it("rejects coordinates outside Algeria", () => {
    const result = treeSubmissionSchema.safeParse({ ...validTree, latitude: "48.85", longitude: "2.35" });
    expect(result.success).toBe(false);
  });

  it("rejects a half-supplied coordinate pair", () => {
    const result = treeSubmissionSchema.safeParse({ ...validTree, latitude: "36.75" });
    expect(result.success).toBe(false);
  });

  it("accepts a complete in-country coordinate pair", () => {
    const result = treeSubmissionSchema.safeParse({ ...validTree, latitude: "36.75", longitude: "3.04" });
    expect(result.success).toBe(true);
  });
});

describe("treeReviewSchema", () => {
  it("requires a reason when rejecting", () => {
    const result = treeReviewSchema.safeParse({
      treeId: "clv0000000000000000000000", action: "REJECTED", reason: "",
    });
    expect(result.success).toBe(false);
  });

  it("allows an approval with no reason", () => {
    const result = treeReviewSchema.safeParse({
      treeId: "clv0000000000000000000000", action: "APPROVED", reason: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("campaignInputSchema", () => {
  const base = {
    title: "Reboisement Blida",
    description: "Une campagne communautaire de reboisement dans la wilaya de Blida.",
    wilayaId: "9",
    commune: "Blida",
    date: "2026-11-20",
    targetTrees: "500",
    organizerName: "Association verte",
    status: "UPCOMING",
  };

  it("accepts a valid campaign", () => {
    expect(campaignInputSchema.safeParse(base).success).toBe(true);
  });

  it("rejects an end time before the start time", () => {
    const result = campaignInputSchema.safeParse({ ...base, startTime: "14:00", endTime: "09:00" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive tree target", () => {
    expect(campaignInputSchema.safeParse({ ...base, targetTrees: "0" }).success).toBe(false);
  });
});

describe("upload validation", () => {
  it("identifies real image bytes by magic number", () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect(sniffImageType(jpeg)).toBe("image/jpeg");
    expect(sniffImageType(png)).toBe("image/png");
  });

  it("rejects an executable disguised as an image", () => {
    // ELF header: 0x7f 'E' 'L' 'F'
    const elf = new Uint8Array([0x7f, 0x45, 0x4c, 0x46, 2, 1, 1, 0, 0, 0, 0, 0]);
    expect(sniffImageType(elf)).toBeNull();
  });

  it("rejects unexpected file extensions", () => {
    expect(hasAllowedExtension("photo.jpg")).toBe(true);
    expect(hasAllowedExtension("photo.PNG")).toBe(true);
    expect(hasAllowedExtension("payload.php")).toBe(false);
    expect(hasAllowedExtension("payload.jpg.php")).toBe(false);
  });
});

describe("blank optional fields (regression)", () => {
  const campaignBase = {
    title: "Reboisement Blida",
    description: "Une campagne communautaire de reboisement dans la wilaya de Blida.",
    wilayaId: "9",
    commune: "Blida",
    date: "2026-11-20",
    targetTrees: "500",
    organizerName: "Association verte",
    status: "UPCOMING",
  };

  it("treats an empty longitude as absent, not as 0", () => {
    // 0 sits inside Algeria's longitude range, so a naive coercion would store
    // an empty field as a real coordinate off the coast.
    const result = campaignInputSchema.safeParse({ ...campaignBase, latitude: "", longitude: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.latitude).toBeNull();
      expect(result.data.longitude).toBeNull();
    }
  });

  it("treats an empty tree longitude as absent", () => {
    const result = treeSubmissionSchema.safeParse({ ...validTree, latitude: "", longitude: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.latitude).toBeNull();
      expect(result.data.longitude).toBeNull();
    }
  });

  it("keeps real coordinates intact", () => {
    const result = treeSubmissionSchema.safeParse({ ...validTree, latitude: "36.75", longitude: "3.04" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.latitude).toBe(36.75);
      expect(result.data.longitude).toBe(3.04);
    }
  });

  it("treats blank optional text and numbers as absent", () => {
    const result = campaignInputSchema.safeParse({
      ...campaignBase, maxParticipants: "", locationLabel: "", coverImageUrl: "", startTime: "", endTime: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.maxParticipants).toBeNull();
      expect(result.data.locationLabel).toBeNull();
      expect(result.data.coverImageUrl).toBeNull();
    }
  });

  it("maps the no-campaign sentinel to an individual planting", () => {
    const result = treeSubmissionSchema.safeParse({ ...validTree, campaignId: "__none__" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.campaignId).toBeNull();
  });
});
