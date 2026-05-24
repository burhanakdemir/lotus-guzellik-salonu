import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "services");

/** Lotus çiçeği dekoratif SVG — sağ üst köşe */
function lotusDecor(id, x, y, scale, opacity = 0.35) {
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

const categoryPalettes = {
  sac: { c1: "#6b3349", c2: "#d97b9a", c3: "#ffd6e4", accent: "#f4a4bc" },
  cilt: { c1: "#5c4a6b", c2: "#e8a0b4", c3: "#fff0f5", accent: "#f4b8c8" },
  tirnak: { c1: "#7a4a5c", c2: "#c25b7d", c3: "#fdeef4", accent: "#ffd6e4" },
  makyaj: { c1: "#8e4462", c2: "#f4a4bc", c3: "#fff9fb", accent: "#ffe4ec" },
};

const services = [
  { slug: "lazer-epilasyon", title: "Lazer Epilasyon", cat: "cilt" },
  { slug: "agda", title: "Ağda", cat: "cilt" },
  { slug: "sac-kesim", title: "Saç Kesim", cat: "sac" },
  { slug: "makyaj", title: "Makyaj", cat: "makyaj" },
  { slug: "ipek-kirpik", title: "İpek Kirpik", cat: "makyaj" },
  { slug: "protez-tirnak", title: "Protez Tırnak", cat: "tirnak" },
  { slug: "sac-sekillendirme", title: "Saç Şekillendirme", cat: "sac" },
  { slug: "sac-boyama", title: "Saç Boyama", cat: "sac" },
  { slug: "cilt-bakimi", title: "Cilt Bakımı", cat: "cilt" },
  { slug: "kas", title: "Kaş", cat: "makyaj" },
  { slug: "biyik", title: "Bıyık", cat: "cilt" },
  { slug: "yuz-agda", title: "Yüz Ağda", cat: "cilt" },
  { slug: "gelin-basi", title: "Gelin Başı", cat: "sac" },
  { slug: "nisan-saci", title: "Nişan Saçı", cat: "sac" },
  { slug: "gelin-makyaji", title: "Gelin Makyajı", cat: "makyaj" },
  { slug: "fon", title: "Fön", cat: "sac" },
  { slug: "manikur-pedikur", title: "Manikür & Pedikür", cat: "tirnak" },
];

const catLabels = { sac: "Saç", cilt: "Cilt & Bakım", tirnak: "Tırnak", makyaj: "Makyaj" };

function buildSvg({ slug, title, cat }) {
  const p = categoryPalettes[cat] || categoryPalettes.cilt;
  const words = title.split(" ");
  const line1 = words.length > 2 ? words.slice(0, 2).join(" ") : title;
  const line2 = words.length > 2 ? words.slice(2).join(" ") : "";

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
  ${lotusDecor(slug + "-sm", 1050, 120, 1.2, 0.2)}

  <!-- Nilüfer yaprakları alt -->
  <path d="M0 780 Q300 720 600 760 T1200 740 L1200 900 L0 900Z" fill="#7BA388" opacity="0.12"/>
  <path d="M0 820 Q400 780 800 800 T1200 790 L1200 900 L0 900Z" fill="#9BB89E" opacity="0.08"/>

  <!-- Kategori -->
  <rect x="72" y="72" width="auto" height="36" rx="18" fill="rgba(255,255,255,0.2)" style="width:200px"/>
  <text x="96" y="98" font-family="system-ui,sans-serif" font-size="14" font-weight="600" letter-spacing="3" fill="#FFF8E7" opacity="0.95">${catLabels[cat] || cat}</text>

  <!-- Başlık -->
  <line x1="72" y1="680" x2="160" y2="680" stroke="#F5D76E" stroke-width="3" opacity="0.9"/>
  <text x="72" y="620" font-family="Georgia,'Times New Roman',serif" font-size="56" font-weight="400" fill="#ffffff" filter="url(#text-shadow-${slug})">${line1}</text>
  ${line2 ? `<text x="72" y="695" font-family="Georgia,serif" font-size="40" fill="#ffffff" opacity="0.95">${line2}</text>` : ""}

  <!-- Marka -->
  <g transform="translate(72, 760)">
    <circle cx="20" cy="20" r="18" fill="rgba(255,255,255,0.15)"/>
    <text x="50" y="28" font-family="Georgia,serif" font-size="22" letter-spacing="4" fill="#F5D76E">LOTUS</text>
    <text x="50" y="52" font-family="system-ui,sans-serif" font-size="12" letter-spacing="2" fill="#ffffff" opacity="0.75">GÜZELLİK SALONU</text>
  </g>
</svg>`;
}

mkdirSync(outDir, { recursive: true });
for (const s of services) {
  writeFileSync(join(outDir, `${s.slug}.svg`), buildSvg(s));
  console.log(`✓ ${s.slug}.svg`);
}

const hero = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
<defs>
  <linearGradient id="h1" x1="0%" y1="100%" x2="100%" y2="0%">
    <stop offset="0%" stop-color="#6b3349"/>
    <stop offset="35%" stop-color="#a84868"/>
    <stop offset="70%" stop-color="#d97b9a"/>
    <stop offset="100%" stop-color="#ffd6e4"/>
  </linearGradient>
  <radialGradient id="h2" cx="70%" cy="30%" r="45%">
    <stop offset="0%" stop-color="#FFE4EC" stop-opacity="0.4"/>
    <stop offset="100%" stop-color="#FFE4EC" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="petal-h" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#FFE4EC"/>
    <stop offset="100%" stop-color="#D97B9A"/>
  </linearGradient>
</defs>
<rect width="1920" height="1080" fill="url(#h1)"/>
<rect width="1920" height="1080" fill="url(#h2)"/>
${Array.from({length:12},(_,i)=>{
  const rot=i*30; const cx=1600; const cy=200;
  return `<ellipse cx="${cx}" cy="${cy-80}" rx="35" ry="90" fill="url(#petal-h)" opacity="0.15" transform="rotate(${rot} ${cx} ${cy})"/>`;
}).join("")}
${Array.from({length:8},(_,i)=>{
  const rot=i*45+15; const cx=1700; const cy=350;
  return `<ellipse cx="${cx}" cy="${cy-50}" rx="22" ry="55" fill="#FFE4EC" opacity="0.12" transform="rotate(${rot} ${cx} ${cy})"/>`;
}).join("")}
<circle cx="1650" cy="280" r="40" fill="#F5D76E" opacity="0.2"/>
<ellipse cx="200" cy="950" rx="350" ry="80" fill="#9BB89E" opacity="0.15"/>
<path d="M0 850 Q480 750 960 820 T1920 780 L1920 1080 L0 1080Z" fill="#7BA388" opacity="0.1"/>
</svg>`;
writeFileSync(join(__dirname, "..", "public", "hero-bg.svg"), hero);
console.log("✓ hero-bg.svg (lotus)");
