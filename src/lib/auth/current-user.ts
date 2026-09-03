import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { SESSION_COOKIE, validateSessionToken, type SessionUser } from "./session";

/**
 * Resolves the signed-in user for the current request. Memoised per request so
 * that layouts, pages and server actions share one database round-trip.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const user = await validateSessionToken(token);
  if (!user) return null;
  // A suspended account keeps its session row but loses every capability.
  if (user.status === "SUSPENDED") return user;
  return user;
});
