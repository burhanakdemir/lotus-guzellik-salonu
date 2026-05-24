/**
 * JPG yoksa kullanılacak SVG yer tutucular — katalog + kategori renkleri
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { servicesCatalog } from "../prisma/services-catalog";
import { SERVICE_CATEGORY_LABELS } from "../src/lib/service-categories";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "services");

function lotusDecor(id: string, x: number, y: number, scale: number, opacity = 0.35) {
  const petals = Array.from({ length: 8 }, (_, i) => {
    const rot = i * 45;
    return `<ellipse cx="${x}" cy="${y - 40 * scale}" rx="${14 * scale}" ry="${32 * scale}" fill="url(#petal-${id})" opacity="${opacity}" transform="rotate(${rot} ${x} ${y})"/>`;
  }).join("");
  const inner = Array.from({ length: 6 }, (_, i) => {
    const rot = i * 60 + 15;
    return `<ellipse cx="${x}" cy="${y - 28 * scale}" rx="${8 * scale}" ry="${18 * scale}" fill="#FFE4EC" opacity="${opacity + 0.15}" transform="rotate(${rot} ${x} ${y})"/>`;
  }).join("");
  return `
  <defs>
    <linearGradient id="petal-${id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE4EC"/>
      <stop offset="50%" stop-color="#F4A4BC"/>
      <stop offset="100%" stop-color="#D97B9A"/>
    </linearGradient>
    <radialGradient id="center-${id}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFF8E7"/>
      <stop offset="100%" stop-color="#F5D76E"/>
    </radialGradient>
  </defs>
  ${petals}
  ${inner}
  <circle cx="${x}" cy="${y}" r="${12 * scale}" fill="url(#center-${id})" opacity="${opacity + 0.2}"/>
  <ellipse cx="${x}" cy="${y + 55 * scale}" rx="${35 * scale}" ry="${8 * scale}" fill="#9BB89E" opacity="0.25"/>
  `;
}

const categoryPalettes: Record<string, { c1: string; c2: string; c3: string }> = {
  "fon-bakim": { c1: "#6b3349", c2: "#d97b9a", c3: "#ffd6e4" },
  kesim: { c1: "#5c3d4a", c2: "#c25b7d", c3: "#fff0f5" },
  renklendirme: { c1: "#7a3d52", c2: "#e8a0b4", c3: "#fdeef4" },
  "kalici-sekillendirme": { c1: "#6b3349", c2: "#a84868", c3: "#ffd6e4" },
  "gecici-sekillendirme": { c1: "#8e4462", c2: "#f4a4bc", c3: "#fff9fb" },
  "sac-uzatma": { c1: "#5c4a6b", c2: "#d97b9a", c3: "#fff0f5" },
  "el-ayak-bakim": { c1: "#7a4a5c", c2: "#c25b7d", c3: "#fdeef4" },
  "makyaj-guzellik": { c1: "#8e4462", c2: "#f4b8c8", c3: "#fff9fb" },
  "cilt-bakimi": { c1: "#5c4a6b", c2: "#e8a0b4", c3: "#fff0f5" },
  "kalici-makyaj": { c1: "#6b3349", c2: "#d97b9a", c3: "#ffe4ec" },
  "lazer-epilasyon": { c1: "#4a5568", c2: "#9bb89e", c3: "#e8f4f0" },
  "agda-hizmetleri": { c1: "#6b4a3a", c2: "#c9a88a", c3: "#faf3eb" },
};

function buildSvg(slug: string, title: string, category: string) {
  const p = categoryPalettes[category] ?? categoryPalettes["cilt-bakimi"];
  const catLabel = SERVICE_CATEGORY_LABELS[category] ?? category;
  const words = title.split(" ");
  const line1 = words.length > 3 ? words.slice(0, 3).join(" ") : title;
  const line2 = words.length > 3 ? words.slice(3).join(" ") : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <defs>
    <linearGradient id="bg-${slug}" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${p.c1}"/>
      <stop offset="35%" stop-color="${p.c2}"/>
      <stop offset="100%" stop-color="${p.c3}"/>
    </linearGradient>
    <linearGradient id="shine-${slug}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.4"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="glow-${slug}" cx="85%" cy="25%" r="55%">
      <stop offset="0%" stop-color="#FFE4EC" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#FFE4EC" stop-opacity="0"/>
    </radialGradient>
    <pattern id="lotus-dots-${slug}" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="0.8" fill="#ffffff" opacity="0.06"/>
    </pattern>
    <filter id="text-shadow-${slug}">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="${p.c1}" flood-opacity="0.5"/>
    </filter>
  </defs>
  <rect width="1200" height="900" fill="url(#bg-${slug})"/>
  <rect width="1200" height="900" fill="url(#glow-${slug})"/>
  <rect width="1200" height="900" fill="url(#lotus-dots-${slug})"/>
  <rect x="0" y="0" width="1200" height="350" fill="url(#shine-${slug})"/>
  ${lotusDecor(slug, 920, 380, 2.8, 0.4)}
  ${lotusDecor(`${slug}-sm`, 1050, 120, 1.2, 0.2)}
  <path d="M0 780 Q300 720 600 760 T1200 740 L1200 900 L0 900Z" fill="#7BA388" opacity="0.12"/>
  <text x="96" y="98" font-family="system-ui,sans-serif" font-size="13" font-weight="600" letter-spacing="2" fill="#FFF8E7" opacity="0.95">${catLabel}</text>
  <line x1="72" y1="680" x2="160" y2="680" stroke="#F5D76E" stroke-width="3" opacity="0.9"/>
  <text x="72" y="620" font-family="Georgia,serif" font-size="52" fill="#ffffff" filter="url(#text-shadow-${slug})">${line1}</text>
  ${line2 ? `<text x="72" y="690" font-family="Georgia,serif" font-size="36" fill="#ffffff" opacity="0.95">${line2}</text>` : ""}
  <text x="72" y="780" font-family="Georgia,serif" font-size="22" letter-spacing="4" fill="#F5D76E">LOTUS</text>
</svg>`;
}

mkdirSync(outDir, { recursive: true });
const categoriesDir = join(outDir, "categories");
mkdirSync(categoriesDir, { recursive: true });

for (const s of servicesCatalog) {
  writeFileSync(join(outDir, `${s.slug}.svg`), buildSvg(s.slug, s.name, s.category));
  console.log(`✓ ${s.slug}.svg`);
}

const categories = [...new Set(servicesCatalog.map((s) => s.category))];
for (const cat of categories) {
  const label = SERVICE_CATEGORY_LABELS[cat] ?? cat;
  writeFileSync(join(categoriesDir, `${cat}.svg`), buildSvg(cat, label, cat));
  console.log(`✓ categories/${cat}.svg`);
}

console.log(
  `\n${servicesCatalog.length} hizmet + ${categories.length} kategori SVG yer tutucu oluşturuldu.`
);
