/**
 * Tema/CSS sorun teşhisi
 * Kullanım: npm run doctor
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILD_LOCK_FILE,
  CACHE_MODE_FILE,
  readCacheMode,
} from "./next-cache.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

console.log("LOTUS — tema / önbellek kontrolü\n");

const mode = readCacheMode(root);
const hasNext = existsSync(join(root, ".next"));
const lock = existsSync(join(root, BUILD_LOCK_FILE));

console.log(`  .next klasörü: ${hasNext ? "var" : "yok"}`);
console.log(`  Önbellek modu: ${mode ?? "(işaret yok — riskli)"}`);
console.log(`  Build kilidi: ${lock ? "AÇIK — build yarım olabilir" : "yok"}`);

if (mode === "prod" && process.env.npm_lifecycle_event !== "build") {
  console.log(
    "\n⚠ Son işlem production build. Dev ile stilsiz sayfa görürseniz:\n   npm run dev:clean\n"
  );
}

if (!hasNext) {
  console.log("\n→ Önbellek yok; npm run dev ile başlatın.");
  process.exit(0);
}

const port = process.env.PORT || "3000";
try {
  const res = await fetch(`http://127.0.0.1:${port}/`, {
    signal: AbortSignal.timeout(3000),
  });
  const html = await res.text();
  const hasCssLink =
    html.includes('rel="stylesheet"') &&
    (html.includes("/_next/static/css/") || html.includes("layout.css"));
  const cssMatch = html.match(
    /href="(\/_next\/static\/css\/[^"]+)"/
  );
  console.log(`\n  localhost:${port} yanıt: ${res.status}`);
  console.log(`  HTML içinde CSS linki: ${hasCssLink ? "evet" : "HAYIR ✖"}`);

  if (cssMatch) {
    const cssUrl = cssMatch[1].startsWith("http")
      ? cssMatch[1]
      : `http://127.0.0.1:${port}${cssMatch[1]}`;
    try {
      const cssRes = await fetch(cssUrl, { signal: AbortSignal.timeout(5000) });
      const cssBody = await cssRes.text();
      const ok =
        cssRes.ok &&
        cssBody.length > 500 &&
        (cssBody.includes("tailwind") ||
          cssBody.includes("lotus") ||
          cssBody.includes("--color-"));
      console.log(
        `  CSS dosyası (${cssRes.status}, ${cssBody.length} bayt): ${ok ? "geçerli ✓" : "BOZUK/BOŞ ✖"}`
      );
      if (!ok) {
        console.log("\n→ Çözüm: npm run dev:clean");
        process.exit(1);
      }
    } catch {
      console.log("  CSS dosyası: indirilemedi ✖");
      console.log("\n→ Çözüm: npm run dev:clean");
      process.exit(1);
    }
  } else if (!hasCssLink) {
    console.log("\n→ Çözüm: npm run dev:clean");
    process.exit(1);
  }
} catch {
  console.log(`\n  localhost:${port} kapalı (dev çalışmıyor).`);
  console.log("→ Başlatmak için: npm run dev  veya  npm run dev:clean");
}

console.log("\n✓ Kontrol bitti.");
process.exit(0);
