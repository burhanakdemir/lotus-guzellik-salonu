/**
 * Canlı sunucuda deploy / container başlangıcı:
 * - Klasörler + statik görseller doğrula (indirme yok)
 * - Veritabanı şeması
 * - Admin şifre senkronu (Render env)
 * - Hizmetler: yalnızca BOŞ DB'de deploy kilidi; mevcut DB'ye dokunulmaz
 */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile, unlink } from "fs/promises";
import { ensureAdminUser } from "./ensure-admin";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd: string, label: string, env: NodeJS.ProcessEnv = process.env) {
  console.log(`\n→ ${label}`);
  execSync(cmd, { cwd: root, stdio: "inherit", env });
}

async function checkUploadRootWritable(): Promise<boolean> {
  try {
    const fromEnv = process.env.UPLOAD_ROOT?.trim();
    const uploadRoot = fromEnv
      ? join(fromEnv)
      : join(root, "public", "uploads");
    await mkdir(uploadRoot, { recursive: true });
    const test = join(uploadRoot, ".write-test");
    await writeFile(test, "ok");
    await unlink(test);
    return true;
  } catch {
    return false;
  }
}

function databaseUrlForPush(): string {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL veya DIRECT_URL tanımlı değil.");
  }
  return url;
}

async function main() {
  console.log("LOTUS canlı kurulum başlıyor…");
  console.log("→ Deploy kilidi: hizmet/görsel listesi deploy sırasında değiştirilmez.");

  run("node scripts/ensure-dirs.mjs", "Klasörler");
  const uploadOk = await checkUploadRootWritable();
  if (uploadOk) {
    console.log("→ Yükleme diskine yazılabiliyor (admin görselleri kalıcı).");
  } else {
    console.warn(
      "⚠ Yükleme klasörüne yazılamıyor — Render disk mount (public/uploads) kontrol edin."
    );
  }
  run("npx tsx scripts/ensure-images.ts", "Statik görseller doğrula (sabit, indirme yok)", {
    ...process.env,
    DEPLOY_LOCK_IMAGES: "true",
  });
  run("npx prisma generate", "Prisma client");
  run("npx prisma db push", "Veritabanı şeması", {
    ...process.env,
    DATABASE_URL: databaseUrlForPush(),
  });

  const prisma = new PrismaClient();
  try {
    await ensureAdminUser(prisma);

    const activeCount = await prisma.service.count({
      where: { deletedAt: null, isActive: true },
    });
    const totalCount = await prisma.service.count();

    const forceLock =
      process.env.FORCE_DEPLOY_LOCK === "true" ||
      process.env.FORCE_DEPLOY_LOCK === "1";
    const runSeed = process.env.RUN_SEED === "true" || process.env.RUN_SEED === "1";

    if (totalCount === 0) {
      run("node scripts/import-deploy-lock.mjs", "İlk kurulum: deploy kilidi (hizmetler)");
      run("npx tsx prisma/seed.ts", "Salon ayarları, kampanya, admin profili", {
        ...process.env,
        SEED_SERVICES: "false",
      });
    } else if (runSeed && forceLock) {
      console.log("\n→ RUN_SEED + FORCE_DEPLOY_LOCK: hizmet kilidi yeniden yükleniyor…");
      run("node scripts/import-deploy-lock.mjs", "Deploy kilidi (zorla)");
    } else if (runSeed) {
      console.log(
        "\n→ RUN_SEED atlandı (DB dolu). Hizmetleri kilitten yüklemek için FORCE_DEPLOY_LOCK=true"
      );
    } else {
      console.log(
        `\n→ Hizmetler korundu (${activeCount} aktif / ${totalCount} toplam). Admin yüklemeleri ve fiyatlar aynı.`
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
