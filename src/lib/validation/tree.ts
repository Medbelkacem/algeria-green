import { z } from "zod";
import {
  communeSchema, isoDateSchema, optionalLatitudeSchema, optionalLongitudeSchema,
  optionalTrimmedString, optionalUrlSchema, wilayaIdSchema,
} from "./common";

const EARLIEST_PLANTING = new Date("2000-01-01T00:00:00.000Z");

export const treeSubmissionSchema = z
  .object({
    speciesId: z.coerce.number().int().positive(),
    speciesOther: optionalTrimmedString(80),
    plantingDate: isoDateSchema,
    wilayaId: wilayaIdSchema,
    commune: communeSchema,
    campaignId: z
      .preprocess(
        (value) => (value === "" || value === "__none__" || value === null || value === undefined ? null : value),
        z.union([z.null(), z.string().cuid()]),
      )
      .optional(),
    latitude: optionalLatitudeSchema,
    longitude: optionalLongitudeSchema,
    notes: optionalTrimmedString(1000),
    anonymous: z.coerce.boolean().catch(false),
    photoUrl: optionalUrlSchema(600),
  })
  .refine((data) => data.plantingDate.getTime() <= Date.now(), {
    message: "validation.futureDate",
    path: ["plantingDate"],
  })
  .refine((data) => data.plantingDate.getTime() >= EARLIEST_PLANTING.getTime(), {
    message: "validation.dateTooOld",
    path: ["plantingDate"],
  })
  .refine((data) => (data.latitude == null) === (data.longitude == null), {
    message: "validation.invalidCoordinates",
    path: ["latitude"],
  });

export const treeReviewSchema = z
  .object({
    treeId: z.string().cuid(),
    action: z.enum(["APPROVED", "REJECTED", "CORRECTION_REQUESTED"]),
    reason: optionalTrimmedString(500),
  })
  .refine((data) => data.action === "APPROVED" || Boolean(data.reason), {
    message: "admin.reviewReasonRequired",
    path: ["reason"],
  });

export const treeFilterSchema = z.object({
  status: z.enum(["PENDING", "VERIFIED", "REJECTED", "ARCHIVED"]).optional().catch(undefined),
  wilayaId: z.coerce.number().int().optional().catch(undefined),
  campaignId: z.string().optional().catch(undefined),
});

export type TreeSubmissionInput = z.infer<typeof treeSubmissionSchema>;
