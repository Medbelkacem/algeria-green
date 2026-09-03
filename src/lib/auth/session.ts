import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { hashToken, randomToken } from "@/lib/security/tokens";

export const SESSION_COOKIE = "dzg_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const SESSION_RENEW_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 15;

export async function createSession(userId: string, meta?: { ip?: string | null; userAgent?: string | null }) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.create({
    data: {
      id: hashToken(token),
      userId,
      expiresAt,
      ip: meta?.ip ?? null,
      userAgent: meta?.userAgent?.slice(0, 255) ?? null,
    },
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return { token, expiresAt };
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "MODERATOR" | "ASSOCIATION" | "ADMIN" | "SUPER_ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  avatarUrl: string | null;
  wilayaId: number | null;
  locale: string;
  emailVerified: Date | null;
  publicProfile: boolean;
};

export async function validateSessionToken(token: string): Promise<SessionUser | null> {
  const sessionId = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          avatarUrl: true,
          wilayaId: true,
          locale: true,
          emailVerified: true,
          publicProfile: true,
        },
      },
    },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => undefined);
    return null;
  }

  // Sliding expiry: extend long-lived sessions that are still in active use.
  if (session.expiresAt.getTime() - Date.now() < SESSION_RENEW_THRESHOLD_MS) {
    await prisma.session
      .update({ where: { id: sessionId }, data: { expiresAt: new Date(Date.now() + SESSION_TTL_MS) } })
      .catch(() => undefined);
  }

  return session.user as SessionUser;
}

export async function destroyCurrentSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.delete({ where: { id: hashToken(token) } }).catch(() => undefined);
  }
  store.delete(SESSION_COOKIE);
}

/** Invalidates every session of a user (password change, suspension, role change). */
export async function destroyAllSessionsFor(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}
