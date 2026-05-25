/**
 * Canlıya almadan önce tüm statik görsellerin yerinde olduğunu doğrular.
 */
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { servicesCatalog } from "../prisma/services-catalog";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");

const requiredRoot = [
  "hero-bg.svg",
  "promo-placeholder.svg",
  "logo-lotus.png",
  "sw.js",
];

const uploadDirs = [
  "uploads/services",
  "uploads/gallery",
  "uploads/reviews",
  "uploads/promotions",
  "uploads/salon",
];

let missing = 0;

function check(path: string, label: string) {
  if (!existsSync(path)) {
    console.error(`✗ Eksik: ${label}`);
    missing++;
    return false;
  }
  return true;
}

for (const file of requiredRoot) {
  check(join(publicDir, file), file);
}

for (const dir of uploadDirs) {
  const full = join(publicDir, dir);
  if (!existsSync(full)) {
    console.error(`✗ Eksik klasör: public/${dir}`);
    missing++;
  }
}

const categories = [...new Set(servicesCatalog.map((s) => s.category))];
for (const category of categories) {
  const jpg = join(publicDir, "services", "categories", `${category}.jpg`);
  const svg = join(publicDir, "services", "categories", `${category}.svg`);
  if (!existsSync(jpg) && !existsSync(svg)) {
    console.error(`✗ Eksik kategori görseli: ${category} (.jpg veya .svg)`);
    missing++;
  }
}

for (const s of servicesCatalog) {
  const jpg = join(publicDir, "services", `${s.slug}.jpg`);
  const svg = join(publicDir, "services", `${s.slug}.svg`);
  if (!existsSync(jpg) && !existsSync(svg)) {
    console.error(`✗ Eksik hizmet görseli: ${s.slug} (.jpg veya .svg)`);
    missing++;
  }
}

if (missing > 0) {
  console.error(`\n${missing} eksik dosya. Çalıştırın: npm run images:prepare`);
  process.exit(1);
}

console.log(
  `✓ Tüm görseller hazır (${servicesCatalog.length} hizmet, ${categories.length} kategori).`
);
