/**
 * data/deploy-lock/services-db.json → DB (yalnızca ilk kurulum / RUN_SEED).
 * Mevcut imageUrl ve admin düzenlemeleri korunur (update'te imageUrl ezilmez).
 */
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const snapshotPath = join(root, "data", "deploy-lock", "services-db.json");

if (!existsSync(snapshotPath)) {
  console.warn("Deploy kilidi yok, atlandı: data/deploy-lock/services-db.json");
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

  const deactivated = await prisma.service.updateMany({
    where: { slug: { notIn: slugs }, deletedAt: null },
    data: { isActive: false, deletedAt: new Date() },
  });

  console.log(
    `✓ Deploy kilidi yüklendi: ${services.length} hizmet` +
      (deactivated.count > 0 ? ` (${deactivated.count} katalog dışı pasif)` : "")
  );
} finally {
  await prisma.$disconnect();
}
