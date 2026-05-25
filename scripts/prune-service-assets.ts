/**
 * Katalogda olmayan hizmet/kategori görsellerini public/services altından siler.
 */
import { readdirSync, unlinkSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { catalogSlugs, servicesCatalog } from "../prisma/services-catalog";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const categories = new Set(servicesCatalog.map((s) => s.category));
const allowedSlugs = new Set(catalogSlugs);
const servicesDir = join(root, "public", "services");
const catDir = join(servicesDir, "categories");

let removed = 0;

function pruneDir(dir: string, allowed: Set<string>) {
  if (!existsSync(dir)) return;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".jpg") && !file.endsWith(".svg")) continue;
    const base = file.replace(/\.(jpg|svg)$/, "");
    if (!allowed.has(base)) {
      unlinkSync(join(dir, file));
      console.log(`✗ silindi: ${file}`);
      removed++;
    }
  }
}

pruneDir(servicesDir, allowedSlugs);
pruneDir(catDir, categories);

console.log(`✓ Görsel temizliği tamam (${removed} dosya silindi).`);
