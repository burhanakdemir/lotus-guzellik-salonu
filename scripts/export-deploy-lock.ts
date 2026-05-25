/**
 * Sabit canlı katalog → data/deploy-lock/services-db.json
 */
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import { servicesCatalog } from "../prisma/services-catalog";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "data", "deploy-lock");
const outFile = join(outDir, "services-db.json");

const prisma = new PrismaClient();

function staticImageUrl(slug: string): string | null {
  const jpg = join(root, "public", "services", `${slug}.jpg`);
  if (existsSync(jpg)) return `/services/${slug}.jpg`;
  return null;
}

function fromCatalog() {
  return servicesCatalog.map((s) => ({
    slug: s.slug,
    name: s.name,
    category: s.category,
    durationMinutes: s.duration,
    price: s.price,
    isFeatured: Boolean(s.featured),
    isActive: true,
    description: `${s.name} hizmetimiz profesyonel ekip ve kaliteli ürünlerle sunulmaktadır. Fiyatlar KDV dahildir.`,
    imageUrl: staticImageUrl(s.slug),
  }));
}

async function main() {
  let services = fromCatalog();
  let source = "services-catalog.ts";

  try {
    const rows = await prisma.service.findMany({
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
    if (rows.length >= servicesCatalog.length) {
      services = rows.map((r) => ({
        ...r,
        imageUrl: r.imageUrl ?? staticImageUrl(r.slug),
      }));
      source = "veritabani";
    }
  } catch {
    /* yerel DB yok */
  }

  const categories = [...new Set(services.map((s) => s.category))].sort();
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    outFile,
    JSON.stringify({ lockedAt: new Date().toISOString(), source, categories, services }, null, 2),
    "utf8"
  );

  console.log(
    `✓ Deploy kilidi: ${services.length} hizmet → data/deploy-lock/services-db.json (${source})`
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
