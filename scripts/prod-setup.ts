/**
 * Canlı sunucuda deploy / container başlangıcı:
 * - Klasörler + statik görseller (repoda JPG/SVG varsa ağ gerekmez)
 * - Veritabanı şeması
 * - Seed yalnızca boş DB veya RUN_SEED=true iken (admin düzenlemelerini korur)
 */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd: string, label: string) {
  console.log(`\n→ ${label}`);
  execSync(cmd, { cwd: root, stdio: "inherit", env: process.env });
}

async function main() {
  console.log("LOTUS canlı kurulum başlıyor…");

  run("node scripts/ensure-dirs.mjs", "Klasörler");
  run("npx tsx scripts/ensure-images.ts", "Statik görseller");
  run("npx prisma generate", "Prisma client");
  run("npx prisma db push", "Veritabanı şeması");

  const prisma = new PrismaClient();
  try {
    const serviceCount = await prisma.service.count();
    const runSeed =
      process.env.RUN_SEED === "true" ||
      process.env.RUN_SEED === "1" ||
      serviceCount === 0;

    if (runSeed) {
      run("npx tsx prisma/seed.ts", "Hizmetler, kategoriler, salon ayarları, admin");
    } else {
      console.log(
        `\n→ Seed atlandı (${serviceCount} hizmet mevcut). Zorlamak için RUN_SEED=true`
      );
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n✓ Canlı kurulum tamamlandı.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
