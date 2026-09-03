import { createHash, randomBytes, randomInt } from "node:crypto";

/** URL-safe random token, used for sessions, verification links and QR codes. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const PUBLIC_ID_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L

/**
 * Non-predictable public identifier for a tree, e.g. `DZG-TREE-7K2P9QXA`.
 * Database ids are never exposed publicly.
 */
export function generateTreePublicId(): string {
  let suffix = "";
  for (let i = 0; i < 8; i += 1) {
    suffix += PUBLIC_ID_ALPHABET[randomInt(PUBLIC_ID_ALPHABET.length)];
  }
  return `DZG-TREE-${suffix}`;
}

export const TREE_PUBLIC_ID_PATTERN = /^DZG-TREE-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/;
