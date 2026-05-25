/**
 * Görseller repoda yoksa (yeni clone) otomatik indirir; varsa doğrular.
 * CI/build öncesi güvenlik ağı.
 */
import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function logJpgCount() {
  const svcDir = join(root, "public", "services");
  if (existsSync(svcDir)) {
    const n = readdirSync(svcDir).filter((f) => f.endsWith(".jpg")).length;
    console.log(`→ Deploy görselleri: ${n} hizmet JPG hazır`);
  }
}

try {
  execSync("npx tsx scripts/verify-assets.ts", { cwd: root, stdio: "inherit" });
  logJpgCount();
} catch {
  console.log("\nGörseller eksik — otomatik hazırlanıyor…");
  execSync("npm run images:prepare", { cwd: root, stdio: "inherit" });
  execSync("npx tsx scripts/verify-assets.ts", { cwd: root, stdio: "inherit" });
  logJpgCount();
}
