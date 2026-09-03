import { describe, expect, it } from "vitest";
import { hashPassword, isStrongPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("verifies a correct password", async () => {
    const hash = await hashPassword("Correct-horse-9");
    expect(await verifyPassword("Correct-horse-9", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("Correct-horse-9");
    expect(await verifyPassword("wrong-password-1", hash)).toBe(false);
  });

  it("never stores the password in the hash", async () => {
    const hash = await hashPassword("Correct-horse-9");
    expect(hash).not.toContain("Correct-horse-9");
    expect(hash.startsWith("scrypt$")).toBe(true);
  });

  it("produces a different hash each time (random salt)", async () => {
    const [a, b] = await Promise.all([hashPassword("Same-password-1"), hashPassword("Same-password-1")]);
    expect(a).not.toBe(b);
    expect(await verifyPassword("Same-password-1", a)).toBe(true);
    expect(await verifyPassword("Same-password-1", b)).toBe(true);
  });

  it("returns false rather than throwing on a malformed hash", async () => {
    expect(await verifyPassword("anything", "not-a-hash")).toBe(false);
    expect(await verifyPassword("anything", "scrypt$x$y$z$a$b")).toBe(false);
  });
});

describe("isStrongPassword", () => {
  it("requires eight characters with a letter and a digit", () => {
    expect(isStrongPassword("abcdefg1")).toBe(true);
    expect(isStrongPassword("كلمةسر123")).toBe(true);
    expect(isStrongPassword("short1")).toBe(false);
    expect(isStrongPassword("alllettersonly")).toBe(false);
    expect(isStrongPassword("12345678")).toBe(false);
  });
});
