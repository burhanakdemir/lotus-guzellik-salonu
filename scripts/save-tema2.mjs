/**
 * Güncel public site görünümünü tema2 yedeğine yazar (kaynak dosyalara dokunmaz).
 * Kullanım: npm run theme:save-tema2
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
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

let fileOk = 0;
for (const rel of TEMA2_FILES) {
  const src = join(root, rel);
  const dest = join(temaDir, rel);
  if (!existsSync(src)) {
    console.warn(`Atlandı (kaynak yok): ${rel}`);
    continue;
  }
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  console.log(`✓ ${rel}`);
  fileOk++;
}

let dirOk = 0;
for (const rel of TEMA2_DIRS) {
  const src = join(root, rel);
  const dest = join(temaDir, rel);
  if (!existsSync(src)) {
    console.warn(`Atlandı (klasör yok): ${rel}`);
    continue;
  }
  copyDirRecursive(src, dest);
  console.log(`✓ ${rel}/ (klasör)`);
  dirOk++;
}

// Admin panelden düzenlenen hizmetler (DB anlık görüntü — projede değişiklik yapmaz)
const dbExport = spawnSync("node", ["scripts/export-services-snapshot.mjs"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});
const dbSnapshotOk = dbExport.status === 0;

const savedAt = new Date().toISOString();
writeFileSync(
  join(temaDir, "SAVED_AT.txt"),
  `Tema2 yedeği\nKayıt: ${savedAt}\nDosya: ${fileOk}/${TEMA2_FILES.length}\nKlasör: ${dirOk}/${TEMA2_DIRS.length}\nDB anlık görüntü: ${dbSnapshotOk ? "evet" : "hayır (veritabanı yok)"}\n`,
  "utf8"
);

console.log(
  `\nTema2 yedeği güncellendi (${fileOk} dosya, ${dirOk} klasör).\nKonum: themes/${TEMA2_NAME}/`
);
