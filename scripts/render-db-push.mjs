/**
 * Render build: prisma db push — Neon direct URL tercih, 30 sn üst sınır.
 * DB ulaşılamazsa build'i durdurmaz (deploy takılmasın).
 */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUSH_TIMEOUT_MS = 30_000;

function pushUrl() {
  const url = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (!url) {
    console.warn("⚠ DATABASE_URL tanımlı değil — db push atlanıyor, build devam ediyor.");
    process.exit(0);
  }
  return url.includes("connect_timeout")
    ? url
    : `${url}${url.includes("?") ? "&" : "?"}connect_timeout=10`;
}

console.log("→ prisma db push (build, max 30 sn)…");
try {
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: pushUrl() },
    timeout: PUSH_TIMEOUT_MS,
  });
  console.log("✓ Veritabanı şeması güncellendi.");
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  console.warn("\n⚠ prisma db push tamamlanamadı — build yine de devam edecek.");
  console.warn("  Neon projesi uyku modunda veya DATABASE_URL/DIRECT_URL hatalı olabilir.");
  if (msg.includes("ETIMEDOUT") || msg.includes("timed out") || msg.includes("SIGTERM")) {
    console.warn("  Sebep: 30 sn bağlantı zaman aşımı.");
  }
  console.warn("  Render → Environment → DATABASE_URL (pooler) ve DIRECT_URL kontrol edin.\n");
  process.exit(0);
}
