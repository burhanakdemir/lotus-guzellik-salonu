/**
 * Veritabanındaki hizmetleri tema2 yedeğine JSON olarak yazar (ekleme/çıkarma yok).
 */
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "themes", "tema2", "data");
const outFile = join(outDir, "services-db.json");

const prisma = new PrismaClient();

try {
  const services = await prisma.service.findMany({
    where: { deletedAt: null },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: {
      slug: true,
      name: true,
      category: true,
      durationMinutes: true,
      price: true,
      isFeatured: true,
      isActive: true,
      description: true,
      imageUrl: true,
    },
  });

  const categories = [...new Set(services.map((s) => s.category))].sort();

  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    outFile,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        categories,
        services,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(
    `✓ ${services.length} hizmet, ${categories.length} kategori → themes/tema2/data/services-db.json`
  );
} finally {
  await prisma.$disconnect();
}
