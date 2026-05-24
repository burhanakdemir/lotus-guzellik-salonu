/**
 * Public site görünümünü tema2 yedeğinden geri yükler.
 * Kullanım: npm run theme:restore-tema2
 */
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import {
  TEMA2_DIRS,
  TEMA2_FILES,
  TEMA2_NAME,
} from "./tema2-manifest.mjs";
import { copyDirRecursive } from "./theme-copy-utils.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const temaDir = join(root, "themes", TEMA2_NAME);

if (!existsSync(temaDir)) {
  console.error(
    `Hata: themes/${TEMA2_NAME}/ bulunamadı. Önce npm run theme:save-tema2 çalıştırın.`
  );
  process.exit(1);
}

let fileOk = 0;
for (const rel of TEMA2_FILES) {
  const src = join(temaDir, rel);
  const dest = join(root, rel);
  if (!existsSync(src)) {
    console.warn(`Atlandı (yedekte yok): ${rel}`);
    continue;
  }
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  console.log(`✓ ${rel}`);
  fileOk++;
}

let dirOk = 0;
for (const rel of TEMA2_DIRS) {
  const src = join(temaDir, rel);
  const dest = join(root, rel);
  if (!existsSync(src)) {
    console.warn(`Atlandı (yedekte klasör yok): ${rel}`);
    continue;
  }
  copyDirRecursive(src, dest);
  console.log(`✓ ${rel}/ (klasör)`);
  dirOk++;
}

const dbImport = spawnSync("node", ["scripts/import-services-snapshot.mjs"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

console.log(
  `\nTema2 geri yüklendi (${fileOk} dosya, ${dirOk} klasör).` +
    (dbImport.status === 0 ? " Hizmet kataloğu (DB) yüklendi." : "") +
    `\nDev sunucusu açıksa sayfayı yenileyin.`
);
