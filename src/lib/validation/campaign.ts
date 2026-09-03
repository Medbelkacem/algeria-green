import { z } from "zod";
import {
  communeSchema,
  isoDateSchema,
  optionalIntSchema,
  optionalLatitudeSchema,
  optionalLongitudeSchema,
  optionalTimeSchema,
  optionalTrimmedString,
  optionalUrlSchema,
  wilayaIdSchema,
} from "./common";

export const campaignInputSchema = z
  .object({
    title: z.string().trim().min(4, { message: "validation.min" }).max(140, { message: "validation.max" }),
    description: z.string().trim().min(20, { message: "validation.min" }).max(5000, { message: "validation.max" }),
    coverImageUrl: optionalUrlSchema(600),
    wilayaId: wilayaIdSchema,
    commune: communeSchema,
    locationLabel: optionalTrimmedString(160),
    latitude: optionalLatitudeSchema,
    longitude: optionalLongitudeSchema,
    date: isoDateSchema,
    startTime: optionalTimeSchema.optional(),
    endTime: optionalTimeSchema.optional(),
    targetTrees: z.coerce.number().int().min(1, { message: "validation.positiveNumber" }).max(1_000_000),
    maxParticipants: optionalIntSchema(1, 100_000),
    organizerName: z.string().trim().min(2, { message: "validation.min" }).max(120, { message: "validation.max" }),
    status: z.enum(["DRAFT", "UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"]),
  })
  .refine(
    (data) => !data.startTime || !data.endTime || data.endTime > data.startTime,
    { message: "validation.endBeforeStart", path: ["endTime"] },
  )
  .refine((data) => (data.latitude == null) === (data.longitude == null), {
    message: "validation.invalidCoordinates",
    path: ["latitude"],
  });

export const campaignStatusSchema = z.object({
  campaignId: z.string().cuid(),
  status: z.enum(["DRAFT", "UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"]),
});

export const campaignFilterSchema = z.object({
  q: z.string().trim().max(120).optional().catch(undefined),
  wilayaId: z.coerce.number().int().optional().catch(undefined),
  status: z.enum(["UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"]).optional().catch(undefined),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
  sort: z.enum(["dateAsc", "dateDesc", "newest", "progress"]).catch("dateAsc"),
  page: z.coerce.number().int().min(1).max(1000).catch(1),
});

export type CampaignInput = z.infer<typeof campaignInputSchema>;
