/**
 * themes/tema2/data/services-db.json → veritabanı (tema2 geri yükleme).
 * Katalogda olmayan slug eklemez; yedekteki kayıtları olduğu gibi yazar.
 */
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const snapshotPath = join(root, "themes", "tema2", "data", "services-db.json");

if (!existsSync(snapshotPath)) {
  console.warn("DB anlık görüntü yok, atlandı: themes/tema2/data/services-db.json");
  process.exit(0);
}

const { services } = JSON.parse(readFileSync(snapshotPath, "utf8"));
const prisma = new PrismaClient();
const slugs = services.map((s) => s.slug);

try {
  for (const s of services) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: {
        name: s.name,
        category: s.category,
        durationMinutes: s.durationMinutes,
        price: s.price,
        isFeatured: s.isFeatured,
        isActive: s.isActive,
        description: s.description ?? undefined,
        imageUrl: s.imageUrl ?? null,
        deletedAt: null,
      },
      create: {
        slug: s.slug,
        name: s.name,
        category: s.category,
        durationMinutes: s.durationMinutes,
        price: s.price,
        isFeatured: s.isFeatured,
        isActive: s.isActive,
        description: s.description ?? "",
        imageUrl: s.imageUrl ?? null,
      },
    });
  }

  await prisma.service.updateMany({
    where: { slug: { notIn: slugs }, deletedAt: null },
    data: { isActive: false, deletedAt: new Date() },
  });

  console.log(`✓ ${services.length} hizmet veritabanına yüklendi (tema2 anlık görüntü)`);
} finally {
  await prisma.$disconnect();
}
