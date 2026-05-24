/**
 * Görseller repoda yoksa (yeni clone) otomatik indirir; varsa doğrular.
 * CI/build öncesi güvenlik ağı.
 */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

try {
  execSync("npx tsx scripts/verify-assets.ts", { cwd: root, stdio: "inherit" });
} catch {
  console.log("\nGörseller eksik — otomatik hazırlanıyor…");
  execSync("npm run images:prepare", { cwd: root, stdio: "inherit" });
  execSync("npx tsx scripts/verify-assets.ts", { cwd: root, stdio: "inherit" });
}
