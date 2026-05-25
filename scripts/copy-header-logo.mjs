/**
 * Header logosu → public/logo/lotus-sade.png
 * Öncelik: kategori resimleri/lotus sade.png | .jpg
 * Kullanım: node scripts/copy-header-logo.mjs
 */
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const destDir = join(root, "public", "logo");
const dest = join(destDir, "lotus-sade.png");

const candidates = [
  join(root, "kategori resimleri", "lotus sade.png"),
  join(root, "kategori resimleri", "lotus sade.jpg"),
];

const src = candidates.find((p) => existsSync(p));

if (!src) {
  console.error("Kaynak bulunamadı. Şunlardan biri gerekli:");
  for (const p of candidates) console.error(`  ${p}`);
  process.exit(1);
}

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log(`✓ Logo kopyalandı: public/logo/lotus-sade.png`);
