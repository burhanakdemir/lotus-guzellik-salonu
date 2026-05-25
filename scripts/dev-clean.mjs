/**
 * Bozuk .next önbelleğini temizleyip dev sunucusunu yeniden başlatır.
 * Kullanım: npm run dev:clean
 *
 * Not: npm run build çalışırken npm run dev AÇMAYIN — .next bozulur, admin stilsiz görünür.
 */
import { execSync, spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function killDevServers() {
  console.log("→ Eski Next dev süreçleri (port 3000/3001)…");
  try {
    if (process.platform === "win32") {
      for (const port of [3000, 3001]) {
        try {
          const out = execSync(
            `netstat -ano | findstr :${port}`,
            { encoding: "utf8", shell: true }
          );
          const pids = new Set(
            out
              .split("\n")
              .map((line) => line.trim().split(/\s+/).pop())
              .filter((pid) => pid && /^\d+$/.test(pid))
          );
          for (const pid of pids) {
            try {
              execSync(`taskkill /F /PID ${pid}`, {
                stdio: "ignore",
                shell: true,
              });
            } catch {
              /* zaten kapalı */
            }
          }
        } catch {
          /* port boş */
        }
      }
    } else {
      execSync("pkill -f 'next dev' || true", { stdio: "ignore" });
    }
  } catch {
    /* yok */
  }
}

killDevServers();

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
