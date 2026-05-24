import { copyFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";

export function copyDirRecursive(srcDir, destDir) {
  if (!existsSync(srcDir)) return false;
  mkdirSync(destDir, { recursive: true });
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const src = join(srcDir, entry.name);
    const dest = join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(src, dest);
    } else {
      copyFileSync(src, dest);
    }
  }
  return true;
}
