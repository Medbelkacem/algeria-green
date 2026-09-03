import type { MetadataRoute } from "next";
import { LOCALES } from "@/i18n/config";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db/prisma";

export const revalidate = 3600;

const STATIC_PATHS = ["", "/campaigns", "/plant", "/impact", "/map", "/wilayas", "/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.appUrl;
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: `${base}/${locale}${path}`,
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1 : 0.7,
      });
    }
  }

  try {
    const [campaigns, wilayas] = await Promise.all([
      prisma.campaign.findMany({
        where: { status: { in: ["UPCOMING", "ACTIVE", "COMPLETED"] } },
        select: { slug: true, updatedAt: true },
        take: 2000,
      }),
      prisma.wilaya.findMany({ select: { code: true } }),
    ]);

    for (const locale of LOCALES) {
      for (const campaign of campaigns) {
        entries.push({
          url: `${base}/${locale}/campaigns/${campaign.slug}`,
          lastModified: campaign.updatedAt,
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
      for (const wilaya of wilayas) {
        entries.push({
          url: `${base}/${locale}/wilayas/${wilaya.code}`,
          changeFrequency: "weekly",
          priority: 0.5,
        });
      }
    }
  } catch {
    // A sitemap must still be served if the database is briefly unavailable.
  }

  return entries;
}
