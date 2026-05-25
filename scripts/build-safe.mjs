/**
 * Güvenli production build — önce dev süreçlerini durdurur, .next modunu sıfırlar.
 */
import { spawn } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  clearBuildLock,
  ensureCacheForMode,
  killDevServers,
  setBuildLock,
  writeCacheMode,
} from "./next-cache.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

killDevServers();
ensureCacheForMode(root, "prod");
setBuildLock(root);

console.log("→ next build… (prebuild npm tarafından çalışır)\n");

const build = spawn("npx", ["next", "build"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

build.on("exit", (code) => {
  clearBuildLock(root);
  if (code === 0) {
    writeCacheMode(root, "prod");
    console.log("\n✓ Build tamam. Yerel test: npm run start (npm run dev değil)\n");
  }
  process.exit(code ?? 1);
});
