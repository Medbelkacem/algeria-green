import "server-only";
import { randomToken } from "@/lib/security/tokens";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  hasAllowedExtension,
  sniffImageType,
} from "@/lib/validation/upload";

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; reason: "too_large" | "bad_type" | "bad_extension" | "no_storage" | "failed" };

const FOLDERS = { tree: "trees", campaign: "campaigns", avatar: "avatars" } as const;
export type UploadKind = keyof typeof FOLDERS;

/**
 * Accepts an image only after checking size, declared type, file extension and
 * magic number, then re-encodes it with sharp. Re-encoding both normalises the
 * output and strips EXIF metadata — including the GPS tags a phone camera
 * writes, which would otherwise leak a contributor's exact position.
 * The stored filename is generated server-side; the user-supplied name is
 * never used to build a path.
 */
export async function storeImage(file: File, kind: UploadKind): Promise<UploadResult> {
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, reason: "too_large" };
  if (file.size === 0) return { ok: false, reason: "bad_type" };
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) return { ok: false, reason: "bad_type" };
  if (!hasAllowedExtension(file.name)) return { ok: false, reason: "bad_extension" };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const sniffed = sniffImageType(bytes);
  if (!sniffed || sniffed !== file.type) return { ok: false, reason: "bad_type" };

  const { default: sharp } = await import("sharp");
  let output: Buffer;
  try {
    output = await sharp(Buffer.from(bytes), { failOn: "error" })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return { ok: false, reason: "failed" };
  }

  const key = `${FOLDERS[kind]}/${new Date().toISOString().slice(0, 7)}/${randomToken(16)}.webp`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = await import("@vercel/blob");
      const blob = await put(key, output, {
        access: "public",
        contentType: "image/webp",
        token: process.env.BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: false,
      });
      return { ok: true, url: blob.url };
    } catch {
      return { ok: false, reason: "failed" };
    }
  }

  // Local development fallback. Serverless filesystems are read-only, so this
  // path is intentionally unavailable in production: the caller gets a clear
  // "storage not configured" error rather than a silent failure.
  if (process.env.NODE_ENV === "production") return { ok: false, reason: "no_storage" };

  try {
    const { mkdir, writeFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const target = path.join(process.cwd(), "public", "uploads", key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, output);
    return { ok: true, url: `/uploads/${key}` };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

export function isStorageConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN) || process.env.NODE_ENV !== "production";
}
