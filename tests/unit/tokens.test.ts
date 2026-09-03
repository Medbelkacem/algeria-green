import { describe, expect, it } from "vitest";
import {
  TREE_PUBLIC_ID_PATTERN, generateTreePublicId, hashToken, randomToken,
} from "@/lib/security/tokens";

describe("generateTreePublicId", () => {
  it("matches the documented DZG-TREE-XXXXXXXX shape", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateTreePublicId()).toMatch(TREE_PUBLIC_ID_PATTERN);
    }
  });

  it("omits ambiguous characters", () => {
    const ids = Array.from({ length: 200 }, () => generateTreePublicId().replace("DZG-TREE-", ""));
    expect(ids.join("")).not.toMatch(/[0OI1L]/);
  });

  it("is not sequential or predictable", () => {
    const ids = new Set(Array.from({ length: 500 }, generateTreePublicId));
    expect(ids.size).toBe(500);
  });
});

describe("token hashing", () => {
  it("never stores the raw token", () => {
    const token = randomToken(32);
    const hash = hashToken(token);
    expect(hash).not.toContain(token);
    expect(hash).toHaveLength(64);
  });

  it("is deterministic for the same token", () => {
    const token = randomToken(32);
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it("produces distinct tokens", () => {
    const tokens = new Set(Array.from({ length: 200 }, () => randomToken(32)));
    expect(tokens.size).toBe(200);
  });
});
