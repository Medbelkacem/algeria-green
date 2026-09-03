/**
 * Reference-data seed.
 *
 * This project deliberately ships NO demo content: no users, campaigns, trees,
 * participants or notifications are ever created here. Only the static
 * administrative reference tables the application needs to function are
 * inserted, and the script is idempotent.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";
import { WILAYAS } from "../src/lib/reference/wilayas";
import { TREE_SPECIES } from "../src/lib/reference/species";

const connectionString = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  for (const wilaya of WILAYAS) {
    await prisma.wilaya.upsert({
      where: { id: wilaya.id },
      create: wilaya,
      update: { code: wilaya.code, nameAr: wilaya.nameAr, nameFr: wilaya.nameFr, nameEn: wilaya.nameEn },
    });
  }
  console.log(`Reference data: ${WILAYAS.length} wilayas ready.`);

  for (const species of TREE_SPECIES) {
    await prisma.treeSpecies.upsert({
      where: { slug: species.slug },
      create: species,
      update: {
        nameAr: species.nameAr,
        nameFr: species.nameFr,
        nameEn: species.nameEn,
        latin: species.latin,
        active: true,
      },
    });
  }
  console.log(`Reference data: ${TREE_SPECIES.length} tree species ready.`);

  const [users, campaigns, trees] = await Promise.all([
    prisma.user.count(),
    prisma.campaign.count(),
    prisma.tree.count(),
  ]);
  console.log(`Content tables untouched — users: ${users}, campaigns: ${campaigns}, trees: ${trees}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
