import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { authenticate, registerUser, resetPasswordWithToken, verifyEmailToken } from "@/services/auth.service";
import { resetContent, uniqueEmail } from "./helpers";

describe("registration and sign-in", () => {
  beforeEach(resetContent);
  afterAll(async () => {
    await resetContent();
    await prisma.$disconnect();
  });

  it("creates a USER with a hashed password and an audit entry", async () => {
    const email = uniqueEmail("register");
    const result = await registerUser({
      name: "Test Planter", email, password: "greenalgeria1", wilayaId: 16, locale: "ar",
    });
    expect(result.ok).toBe(true);

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).not.toBeNull();
    expect(user!.role).toBe("USER");
    expect(user!.status).toBe("ACTIVE");
    expect(user!.passwordHash).not.toContain("greenalgeria1");
    expect(user!.emailVerified).toBeNull();

    const audit = await prisma.auditLog.findFirst({ where: { entityId: user!.id, action: "user.registered" } });
    expect(audit).not.toBeNull();
  });

  it("refuses a duplicate email address", async () => {
    const email = uniqueEmail("dupe");
    await registerUser({ name: "First", email, password: "greenalgeria1", wilayaId: null, locale: "ar" });
    const second = await registerUser({
      name: "Second", email, password: "greenalgeria2", wilayaId: null, locale: "ar",
    });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.reason).toBe("email_taken");
    expect(await prisma.user.count({ where: { email } })).toBe(1);
  });

  it("authenticates with the right password and rejects the wrong one", async () => {
    const email = uniqueEmail("signin");
    await registerUser({ name: "Signer", email, password: "greenalgeria1", wilayaId: null, locale: "ar" });

    expect((await authenticate(email, "greenalgeria1")).ok).toBe(true);
    const bad = await authenticate(email, "wrongpassword1");
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.reason).toBe("invalid_credentials");
  });

  it("reports invalid_credentials for an unknown account, never a distinct error", async () => {
    const result = await authenticate("nobody.here@example.dz", "greenalgeria1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("invalid_credentials");
  });

  it("blocks a suspended account from signing in", async () => {
    const email = uniqueEmail("suspended");
    await registerUser({ name: "Suspended", email, password: "greenalgeria1", wilayaId: null, locale: "ar" });
    await prisma.user.update({ where: { email }, data: { status: "SUSPENDED" } });

    const result = await authenticate(email, "greenalgeria1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("suspended");
  });

  it("verifies an email exactly once", async () => {
    const email = uniqueEmail("verify");
    const registered = await registerUser({
      name: "Verifier", email, password: "greenalgeria1", wilayaId: null, locale: "ar",
    });
    expect(registered.ok).toBe(true);

    // The raw token is never stored, so it is not readable from the database:
    // an invalid token must simply fail.
    expect(await verifyEmailToken("not-a-real-token")).toBe(false);
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user!.emailVerified).toBeNull();
  });

  it("refuses a password reset with an unknown token", async () => {
    expect(await resetPasswordWithToken("bogus-token", "greenalgeria9")).toBe(false);
  });
});
