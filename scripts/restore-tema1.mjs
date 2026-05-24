/**
 * Ana sayfa / public site stilini tema1 yedeğinden geri yükler.
 * Kullanım: npm run theme:restore-tema1
 */
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tema1 = join(root, "themes", "tema1");

const files = [
  ["src/app/globals.css", "src/app/globals.css"],
  ["src/app/page.tsx", "src/app/page.tsx"],
  ["src/app/layout.tsx", "src/app/layout.tsx"],
  ["src/components/WeeklyPromotions.tsx", "src/components/WeeklyPromotions.tsx"],
  ["src/components/Header.tsx", "src/components/Header.tsx"],
  ["src/components/Footer.tsx", "src/components/Footer.tsx"],
  ["src/components/ServiceCard.tsx", "src/components/ServiceCard.tsx"],
  ["public/hero-bg.svg", "public/hero-bg.svg"],
  ["public/promo-placeholder.svg", "public/promo-placeholder.svg"],
];

let ok = 0;
for (const [from, to] of files) {
  const src = join(tema1, from);
  const dest = join(root, to);
  if (!existsSync(src)) {
    console.warn(`Atlandı (yok): ${from}`);
    continue;
  }
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  console.log(`✓ ${to}`);
  ok++;
}

console.log(`\nTema1 geri yüklendi (${ok}/${files.length} dosya).`);
