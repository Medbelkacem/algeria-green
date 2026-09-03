import "server-only";
import type { TokenType } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { hashToken, randomToken } from "@/lib/security/tokens";
import { destroyAllSessionsFor } from "@/lib/auth/session";
import { sendMail } from "@/lib/auth/mailer";
import { env } from "@/lib/env";
import { recordAudit } from "./audit.service";

const VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24; // 24 h
const RESET_TTL_MS = 1000 * 60 * 60; // 1 h

export type RegisterResult =
  | { ok: true; userId: string; verificationDelivered: boolean }
  | { ok: false; reason: "email_taken" };

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  wilayaId: number | null;
  locale: string;
  ip?: string | null;
}): Promise<RegisterResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) return { ok: false, reason: "email_taken" };

  const passwordHash = await hashPassword(input.password);

  let userId: string;
  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          wilayaId: input.wilayaId,
          locale: input.locale,
          role: "USER",
        },
        select: { id: true },
      });
      await recordAudit(tx, {
        actorId: created.id,
        action: "user.registered",
        entityType: "User",
        entityId: created.id,
        metadata: {},
        ip: input.ip,
      });
      return created;
    });
    userId = user.id;
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return { ok: false, reason: "email_taken" };
    throw error;
  }

  const { delivered } = await issueToken(userId, input.email, "EMAIL_VERIFICATION", input.locale);
  return { ok: true, userId, verificationDelivered: delivered };
}

export type LoginResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "invalid_credentials" | "suspended" };

export async function authenticate(email: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, status: true },
  });

  if (!user) {
    // Constant-ish work regardless of account existence, to avoid leaking
    // which addresses are registered through response timing.
    await verifyPassword(password, "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAA");
    return { ok: false, reason: "invalid_credentials" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { ok: false, reason: "invalid_credentials" };
  if (user.status === "SUSPENDED") return { ok: false, reason: "suspended" };
  return { ok: true, userId: user.id };
}

async function issueToken(userId: string, email: string, type: TokenType, locale: string) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + (type === "PASSWORD_RESET" ? RESET_TTL_MS : VERIFICATION_TTL_MS));

  await prisma.$transaction(async (tx) => {
    // Only the newest link of a given type stays usable.
    await tx.verificationToken.deleteMany({ where: { userId, type, usedAt: null } });
    await tx.verificationToken.create({
      data: { userId, tokenHash: hashToken(token), type, expiresAt },
    });
  });

  const path = type === "PASSWORD_RESET" ? "reset-password" : "verify-email";
  const url = `${env.appUrl}/${locale}/${path}?token=${encodeURIComponent(token)}`;
  const result = await sendMail({
    to: email,
    subject:
      type === "PASSWORD_RESET"
        ? "Algeria Green — password reset"
        : "Algeria Green — confirm your email address",
    body: url,
  });
  return { token, url, delivered: result.delivered };
}

export async function requestEmailVerification(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, locale: true, emailVerified: true },
  });
  if (!user || user.emailVerified) return { delivered: false, alreadyVerified: Boolean(user?.emailVerified) };
  const { delivered } = await issueToken(userId, user.email, "EMAIL_VERIFICATION", user.locale);
  return { delivered, alreadyVerified: false };
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, locale: true },
  });
  // Always report the same outcome so the endpoint cannot enumerate accounts.
  if (!user) return { delivered: false };
  const { delivered } = await issueToken(user.id, user.email, "PASSWORD_RESET", user.locale);
  return { delivered };
}

async function consumeToken(token: string, type: TokenType) {
  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, type: true, expiresAt: true, usedAt: true },
  });
  if (!record || record.type !== type || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
    return null;
  }
  return record;
}

export async function verifyEmailToken(token: string): Promise<boolean> {
  const record = await consumeToken(token, "EMAIL_VERIFICATION");
  if (!record) return false;
  await prisma.$transaction([
    prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
  ]);
  return true;
}

export async function resetPasswordWithToken(token: string, password: string): Promise<boolean> {
  const record = await consumeToken(token, "PASSWORD_RESET");
  if (!record) return false;
  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
  ]);
  // Any session opened with the old password is no longer trustworthy.
  await destroyAllSessionsFor(record.userId);
  return true;
}

export async function changePassword(userId: string, currentPassword: string, nextPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user) return { ok: false as const, reason: "invalid_credentials" as const };
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return { ok: false as const, reason: "invalid_credentials" as const };
  }
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(nextPassword) },
  });
  await destroyAllSessionsFor(userId);
  return { ok: true as const };
}
