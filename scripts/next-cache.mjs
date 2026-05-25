/**
 * .next önbellek modu — dev ve build aynı klasörü bozmasın.
 * @see scripts/dev.mjs, scripts/build-safe.mjs
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

/** .next dışında — next dev/build klasörü sıfırlayınca kaybolmasın */
export const CACHE_MODE_FILE = ".lotus-cache-mode";
export const BUILD_LOCK_FILE = ".lotus-build-lock";

export function killDevServers() {
  try {
    if (process.platform === "win32") {
      for (const port of [3000, 3001]) {
        try {
          const out = execSync(`netstat -ano | findstr :${port}`, {
            encoding: "utf8",
            shell: true,
          });
          const pids = new Set(
            out
              .split("\n")
              .map((line) => line.trim().split(/\s+/).pop())
              .filter((pid) => pid && /^\d+$/.test(pid))
          );
          for (const pid of pids) {
            try {
              execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore", shell: true });
            } catch {
              /* kapalı */
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

export function readCacheMode(root) {
  const path = join(root, CACHE_MODE_FILE);
  if (!existsSync(path)) return null;
  try {
    const v = readFileSync(path, "utf8").trim();
    return v === "dev" || v === "prod" ? v : null;
  } catch {
    return null;
  }
}

export function writeCacheMode(root, mode) {
  const nextDir = join(root, ".next");
  mkdirSync(nextDir, { recursive: true });
  writeFileSync(join(root, CACHE_MODE_FILE), mode, "utf8");
}

export function removeNextCache(root) {
  const nextDir = join(root, ".next");
  try {
    rmSync(nextDir, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

/** Dev/build modu uyumsuzsa veya kilit/eksik önbellek varsa temizle */
export function ensureCacheForMode(root, targetMode) {
  const lockPath = join(root, BUILD_LOCK_FILE);
  const nextDir = join(root, ".next");
  const current = readCacheMode(root);

  let reason = null;
  if (existsSync(lockPath)) reason = "yarım kalmış build";
  else if (current && current !== targetMode) {
    reason = current === "prod" ? "son işlem: production build" : "son işlem: dev sunucusu";
  } else if (existsSync(nextDir) && !current) {
    reason = "işaretsiz eski .next önbelleği";
  }

  if (!reason) return false;

  console.log(`→ .next temizleniyor (${reason})…`);
  killDevServers();
  const ok = removeNextCache(root);
  if (!ok) {
    console.warn(
      "⚠ .next silinemedi (dosya kilitli). Tüm terminal/Cursor görevlerini kapatıp: npm run dev:clean"
    );
  }
  return true;
}

export function setBuildLock(root) {
  writeFileSync(join(root, BUILD_LOCK_FILE), String(Date.now()), "utf8");
}

export function clearBuildLock(root) {
  try {
    rmSync(join(root, BUILD_LOCK_FILE), { force: true });
  } catch {
    /* yok */
  }
}
