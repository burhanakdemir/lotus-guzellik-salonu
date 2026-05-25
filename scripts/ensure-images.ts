/**
 * Build/deploy öncesi görselleri doğrular.
 * Canlı/CI'da indirme YAPMAZ — repodaki JPG/SVG sabittir (DEPLOY_LOCK).
 */
import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const lockImages =
  process.env.DEPLOY_LOCK_IMAGES === "1" ||
  process.env.DEPLOY_LOCK_IMAGES === "true" ||
  process.env.NODE_ENV === "production" ||
  process.env.CI === "true" ||
  process.env.RENDER === "true";

function logJpgCount() {
  const svcDir = join(root, "public", "services");
  if (existsSync(svcDir)) {
    const n = readdirSync(svcDir).filter((f) => f.endsWith(".jpg")).length;
    console.log(`→ Statik görseller (sabit): ${n} hizmet JPG`);
  }
}

try {
  execSync("npx tsx scripts/verify-assets.ts", { cwd: root, stdio: "inherit" });
  logJpgCount();
} catch (e) {
  if (lockImages) {
    console.error(
      "\n✗ Görseller repoda eksik. Canlıda otomatik indirme kapalı (deploy kilidi).\n" +
        "  Yerelde: npm run images:prepare && git add public/services && commit\n"
    );
    process.exit(1);
  }
  console.log("\nGörseller eksik — yerel geliştirme: otomatik hazırlanıyor…");
  execSync("npm run images:prepare", { cwd: root, stdio: "inherit" });
  execSync("npx tsx scripts/verify-assets.ts", { cwd: root, stdio: "inherit" });
  logJpgCount();
}
