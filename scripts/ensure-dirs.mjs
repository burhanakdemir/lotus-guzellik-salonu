/**
 * Deploy öncesi gerekli upload klasörlerini oluşturur.
 */
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

const dirs = [
  "uploads/services",
  "uploads/gallery",
  "uploads/reviews",
  "uploads/promotions",
  "services/categories",
];

for (const dir of dirs) {
  const full = join(publicDir, dir);
  mkdirSync(full, { recursive: true });
  const keep = join(full, ".gitkeep");
  if (!existsSync(keep)) writeFileSync(keep, "");
}

console.log(`✓ Upload ve hizmet klasörleri hazır (${dirs.length}).`);
