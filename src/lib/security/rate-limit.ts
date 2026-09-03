import "server-only";
import { prisma } from "@/lib/db/prisma";

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

/**
 * Fixed-window limiter backed by Postgres so that the budget is shared across
 * serverless instances. Keys are namespaced, e.g. `signin:ip:41.x.x.x`.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);

  try {
    const existing = await prisma.rateLimit.findUnique({ where: { key } });

    if (!existing || existing.resetAt <= now) {
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt },
      });
      return { ok: true };
    }

    if (existing.count >= limit) {
      return {
        ok: false,
        retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1000)),
      };
    }

    await prisma.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
    return { ok: true };
  } catch {
    // Never let limiter storage take the whole request down.
    return { ok: true };
  }
}

export async function clearRateLimit(key: string) {
  await prisma.rateLimit.delete({ where: { key } }).catch(() => undefined);
}

/** Best-effort client address; Vercel sets `x-forwarded-for`. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
