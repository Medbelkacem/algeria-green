import { z } from "zod";
import { WILAYAS } from "@/lib/reference/wilayas";
import { ALGERIA_BOUNDS } from "@/lib/security/geo";

const WILAYA_IDS = WILAYAS.map((w) => w.id);

export const wilayaIdSchema = z
  .coerce.number()
  .int()
  .refine((id) => WILAYA_IDS.includes(id), { message: "validation.invalidWilaya" });

export const optionalWilayaIdSchema = z
  .preprocess(
    (value) => (value === "" || value === "__none__" || value === null || value === undefined ? null : value),
    z.union([z.null(), wilayaIdSchema]),
  )
  .optional();

export const latitudeSchema = z.coerce
  .number()
  .min(ALGERIA_BOUNDS.minLat, { message: "validation.invalidCoordinates" })
  .max(ALGERIA_BOUNDS.maxLat, { message: "validation.invalidCoordinates" });

export const longitudeSchema = z.coerce
  .number()
  .min(ALGERIA_BOUNDS.minLng, { message: "validation.invalidCoordinates" })
  .max(ALGERIA_BOUNDS.maxLng, { message: "validation.invalidCoordinates" });

/**
 * Blank form fields must become null *before* any numeric coercion. Without
 * this, `Number("")` is 0 — a value that happens to fall inside Algeria's
 * longitude range and would be stored as a real coordinate.
 */
const emptyToNull = (value: unknown) =>
  value === "" || value === null || value === undefined ? null : value;

export const optionalLatitudeSchema = z
  .preprocess(emptyToNull, z.union([z.null(), latitudeSchema]))
  .optional();
export const optionalLongitudeSchema = z
  .preprocess(emptyToNull, z.union([z.null(), longitudeSchema]))
  .optional();

export function optionalIntSchema(min: number, max: number) {
  return z.preprocess(emptyToNull, z.union([z.null(), z.coerce.number().int().min(min).max(max)])).optional();
}

export function optionalTrimmedString(max: number) {
  return z
    .preprocess(emptyToNull, z.union([z.null(), z.string().trim().max(max, { message: "validation.max" })]))
    .optional();
}

export function optionalUrlSchema(max: number) {
  return z.preprocess(emptyToNull, z.union([z.null(), z.string().url().max(max)])).optional();
}

export const communeSchema = z
  .string()
  .trim()
  .min(2, { message: "validation.required" })
  .max(80, { message: "validation.max" });

/** Accepts `YYYY-MM-DD` and returns a UTC date, avoiding timezone drift. */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "validation.invalidDate" })
  .transform((value, ctx) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: "custom", message: "validation.invalidDate" });
      return z.NEVER;
    }
    return date;
  });

export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "validation.invalidDate" });

export const optionalTimeSchema = z
  .union([timeSchema, z.literal("")])
  .transform((v) => (v === "" ? null : v));

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
  perPage: z.coerce.number().int().min(1).max(50).catch(12),
});

export const searchQuerySchema = z
  .string()
  .trim()
  .max(120)
  .transform((v) => (v.length ? v : undefined))
  .optional()
  .catch(undefined);

export const localeSchema = z.enum(["ar", "fr", "en"]);
