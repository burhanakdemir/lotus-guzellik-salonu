/**
 * Bozuk .next önbelleğini temizleyip dev sunucusunu yeniden başlatır.
 * Kullanım: npm run dev:clean
 */
import { execSync, spawn } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  killDevServers,
  removeNextCache,
  writeCacheMode,
} from "./next-cache.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

console.log("→ Eski Next dev süreçleri (port 3000/3001)…");
killDevServers();

if (removeNextCache(root)) {
  console.log("→ .next silindi");
} else {
  console.warn("→ .next silinemedi (dosya kilitli olabilir)");
}

console.log("→ prisma generate…");
execSync("npx prisma generate", { cwd: root, stdio: "inherit" });

writeCacheMode(root, "dev");

console.log("\n→ npm run dev başlatılıyor…\n");
const child = spawn("node", ["scripts/dev.mjs"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
