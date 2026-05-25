/**
 * Render canlı başlangıç: standalone + public/static kopyası (Docker ile aynı mantık).
 * next start + output:standalone → /services/*.jpg 404 verebilir.
 */
import { cpSync, existsSync, mkdirSync, rmSync, symlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const standaloneDir = join(root, ".next", "standalone");
const serverJs = join(standaloneDir, "server.js");

if (!existsSync(serverJs)) {
  console.error("✗ .next/standalone/server.js yok — önce npm run build çalıştırın.");
  process.exit(1);
}

const publicSrc = join(root, "public");
const publicDest = join(standaloneDir, "public");
const staticSrc = join(root, ".next", "static");
const staticDest = join(standaloneDir, ".next", "static");

console.log("→ Standalone: public/ ve .next/static kopyalanıyor…");
cpSync(publicSrc, publicDest, { recursive: true });
cpSync(staticSrc, staticDest, { recursive: true });

const uploadsReal = join(root, "public", "uploads");
for (const sub of ["services", "gallery", "reviews", "promotions"]) {
  mkdirSync(join(uploadsReal, sub), { recursive: true });
}
const uploadsLink = join(publicDest, "uploads");
try {
  rmSync(uploadsLink, { recursive: true, force: true });
} catch {
  /* yok */
}
try {
  symlinkSync(uploadsReal, uploadsLink, "dir");
  console.log("→ uploads → kalıcı disk (public/uploads symlink)");
} catch {
  cpSync(uploadsReal, uploadsLink, { recursive: true });
  console.log("→ uploads kopyalandı (symlink yok)");
}

console.log("→ prod-setup…");
const setup = spawn("npx", ["tsx", "scripts/prod-setup.ts"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
  shell: true,
});

setup.on("exit", (code) => {
  if (code !== 0) process.exit(code ?? 1);

  console.log("→ node server.js (standalone)…");
  const server = spawn("node", ["server.js"], {
    cwd: standaloneDir,
    stdio: "inherit",
    env: {
      ...process.env,
      HOSTNAME: process.env.HOSTNAME || "0.0.0.0",
      PORT: process.env.PORT || "10000",
    },
  });
  server.on("exit", (c) => process.exit(c ?? 0));
});
