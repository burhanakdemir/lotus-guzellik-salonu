/**
 * Katalogdaki tüm hizmetler için kategoriye uygun JPG indirir.
 * Çıktı: public/services/{slug}.jpg
 */
import { writeFileSync, mkdirSync, copyFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { servicesCatalog } from "../prisma/services-catalog";
import { pexelsUrl, photoIdForService } from "./service-image-sources";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "services");
const categoriesDir = join(outDir, "categories");

mkdirSync(outDir, { recursive: true });
mkdirSync(categoriesDir, { recursive: true });

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: { "User-Agent": "LotusGuzellik/1.0", Accept: "image/*" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 5000) throw new Error("Dosya çok küçük");
  return buf;
}

/** Aynı fotoğrafı tekrar indirmemek için önbellek */
const downloadedByUrl = new Map<string, string>();

async function ensureCategoryImages() {
  const categories = [...new Set(servicesCatalog.map((s) => s.category))];
  for (const category of categories) {
    const sample = servicesCatalog.find((s) => s.category === category)!;
    const photoId = photoIdForService(sample.slug, category);
    const url = pexelsUrl(photoId);
    const dest = join(categoriesDir, `${category}.jpg`);
    if (existsSync(dest)) {
      downloadedByUrl.set(url, dest);
      console.log(`○ categories/${category}.jpg (mevcut)`);
      continue;
    }
    try {
      const buf = await download(url);
      writeFileSync(dest, buf);
      downloadedByUrl.set(url, dest);
      console.log(`✓ categories/${category}.jpg`);
    } catch (e) {
      console.error(`✗ kategori ${category}:`, (e as Error).message);
    }
  }
}

async function downloadServiceImages() {
  let ok = 0;
  let fail = 0;

  for (const s of servicesCatalog) {
    const photoId = photoIdForService(s.slug, s.category);
    const url = pexelsUrl(photoId);
    const dest = join(outDir, `${s.slug}.jpg`);

    if (existsSync(dest)) {
      ok++;
      continue;
    }

    if (downloadedByUrl.has(url)) {
      const src = downloadedByUrl.get(url)!;
      if (src !== dest && existsSync(src)) {
        copyFileSync(src, dest);
        console.log(`↳ ${s.slug}.jpg (kopya)`);
        ok++;
        continue;
      }
    }

    try {
      const buf = await download(url);
      writeFileSync(dest, buf);
      downloadedByUrl.set(url, dest);
      console.log(`✓ ${s.slug}.jpg (${Math.round(buf.length / 1024)} KB)`);
      ok++;
    } catch (e) {
      console.error(`✗ ${s.slug}:`, (e as Error).message);
      fail++;
    }
  }

  console.log(`\n${ok} görsel hazır, ${fail} hata.`);
}

async function main() {
  await ensureCategoryImages();
  await downloadServiceImages();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
