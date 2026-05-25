import "server-only";
import path from "path";
import {
  type UploadSubdir,
  resolveUploadPublicUrl,
  uploadPublicUrl,
} from "./upload-urls";

export type { UploadSubdir } from "./upload-urls";
export { resolveUploadPublicUrl, uploadPublicUrl };

/** Admin / yorum yüklemeleri (Render: public/uploads disk mount) */
export function getUploadRoot(): string {
  const fromEnv = process.env.UPLOAD_ROOT?.trim();
  if (fromEnv) return path.resolve(fromEnv);
  return path.join(process.cwd(), "public", "uploads");
}

export function getUploadSubdir(subdir: UploadSubdir): string {
  return path.join(getUploadRoot(), subdir);
}

export async function isUploadRootWritable(): Promise<boolean> {
  try {
    const { mkdir, writeFile, unlink } = await import("fs/promises");
    const root = getUploadRoot();
    await mkdir(root, { recursive: true });
    const test = path.join(root, ".write-test");
    await writeFile(test, "ok");
    await unlink(test);
    return true;
  } catch {
    return false;
  }
}
