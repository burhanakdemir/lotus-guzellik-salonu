/**
 * Bozuk .next önbelleğini temizleyip dev sunucusunu yeniden başlatır.
 * Kullanım: npm run dev:clean
 */
import { execSync, spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

console.log("→ Node süreçleri durduruluyor…");
try {
  if (process.platform === "win32") {
    execSync('taskkill /F /IM node.exe 2>nul', { stdio: "ignore", shell: true });
  } else {
    execSync("pkill -f 'next dev' || true", { stdio: "ignore" });
  }
} catch {
  /* yok */
}

const nextDir = join(root, ".next");
try {
  rmSync(nextDir, { recursive: true, force: true });
  console.log("→ .next silindi");
} catch {
  console.warn("→ .next silinemedi (dosya kilitli olabilir)");
}

console.log("→ prisma generate…");
execSync("npx prisma generate", { cwd: root, stdio: "inherit" });

console.log("\n→ npm run dev başlatılıyor…\n");
const child = spawn("npm run dev", {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
