/**
 * Deploy öncesi gerekli upload klasörlerini oluşturur.
 */
import { mkdirSync, writeFileSync, existsSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");

const dirs = [
  "uploads/services",
  "uploads/gallery",
  "uploads/reviews",
  "uploads/promotions",
  "uploads/salon",
  "services/categories",
];

for (const dir of dirs) {
  const full = join(publicDir, dir);
  mkdirSync(full, { recursive: true });
  const keep = join(full, ".gitkeep");
  if (!existsSync(keep)) writeFileSync(keep, "");
}

const logoDir = join(publicDir, "logo");
mkdirSync(logoDir, { recursive: true });
const logoDest = join(logoDir, "lotus-sade.png");
const logoCandidates = [
  join(root, "kategori resimleri", "lotus sade.png"),
  join(root, "kategori resimleri", "lotus sade.jpg"),
];
const logoSrc = logoCandidates.find((p) => existsSync(p));
if (logoSrc) {
  copyFileSync(logoSrc, logoDest);
  console.log("✓ Header logosu: public/logo/lotus-sade.png");
} else if (!existsSync(logoDest)) {
  console.warn(
    "⚠ public/logo/lotus-sade.png yok — logo dosyasını ekleyin veya npm run logo:copy"
  );
}

console.log(`✓ Upload ve hizmet klasörleri hazır (${dirs.length}).`);
