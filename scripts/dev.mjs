/**
 * Güvenli geliştirme sunucusu — build ile karışmış .next otomatik temizlenir.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILD_LOCK_FILE,
  ensureCacheForMode,
  killDevServers,
  writeCacheMode,
} from "./next-cache.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

if (existsSync(join(root, BUILD_LOCK_FILE))) {
  console.error(
    "\n✖ Build hâlâ çalışıyor veya yarım kaldı. Bitmesini bekleyin veya: npm run dev:clean\n"
  );
  process.exit(1);
}

killDevServers();
ensureCacheForMode(root, "dev");
writeCacheMode(root, "dev");

console.log("→ next dev (CSS/Tailwind için tutarlı önbellek)\n");
console.log("  İpucu: npm run build çalışırken dev AÇMAYIN.\n");

const child = spawn("npx", ["next", "dev"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
