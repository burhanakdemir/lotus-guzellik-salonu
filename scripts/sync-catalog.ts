/**
 * Veritabanını prisma/services-catalog.ts ile hizalar.
 * - Katalogdaki hizmetler upsert (imageUrl=null → statik /services/{slug}.jpg)
 * - Katalog dışı aktif hizmetler pasifleştirilir
 */
import { PrismaClient } from "@prisma/client";
import { catalogSlugs, servicesCatalog } from "../prisma/services-catalog";

export async function syncServicesCatalog(prisma: PrismaClient): Promise<void> {
  for (const s of servicesCatalog) {
    const description = `${s.name} hizmetimiz profesyonel ekip ve kaliteli ürünlerle sunulmaktadır. Fiyatlar KDV dahildir.`;
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: {
        name: s.name,
        category: s.category,
        durationMinutes: s.duration,
        price: s.price,
        isFeatured: s.featured ?? false,
        isActive: true,
        deletedAt: null,
        description,
        imageUrl: null,
      },
      create: {
        name: s.name,
        slug: s.slug,
        category: s.category,
        durationMinutes: s.duration,
        price: s.price,
        isFeatured: s.featured ?? false,
        isActive: true,
        description,
        imageUrl: null,
      },
    });
  }

  const deactivated = await prisma.service.updateMany({
    where: {
      slug: { notIn: catalogSlugs },
      deletedAt: null,
    },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });

  const categories = new Set(servicesCatalog.map((s) => s.category));
  console.log(
    `→ Katalog senkron: ${servicesCatalog.length} hizmet, ${categories.size} kategori` +
      (deactivated.count > 0 ? ` (${deactivated.count} fazla pasif)` : "")
  );
}
