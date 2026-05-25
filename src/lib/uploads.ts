import path from "path";

/** Admin / yorum yüklemeleri (Render: public/uploads disk mount) */
export function getUploadRoot(): string {
  const fromEnv = process.env.UPLOAD_ROOT?.trim();
  if (fromEnv) return path.resolve(fromEnv);
  return path.join(process.cwd(), "public", "uploads");
}

export type UploadSubdir = "services" | "gallery" | "reviews" | "promotions";

export function getUploadSubdir(subdir: UploadSubdir): string {
  return path.join(getUploadRoot(), subdir);
}

/** Tarayıcıda sunulan URL (Next statik yerine API ile okunur — Render uyumlu) */
export function uploadPublicUrl(subdir: UploadSubdir, filename: string): string {
  return `/api/files/${subdir}/${filename}`;
}

/** DB'deki /uploads/... veya göreli yolu API URL'sine çevirir */
export function resolveUploadPublicUrl(stored: string): string {
  if (stored.startsWith("/api/files/")) return stored;
  if (stored.startsWith("/uploads/")) {
    return `/api/files${stored.slice("/uploads".length)}`;
  }
  if (stored.startsWith("/")) return stored;
  return `/api/files/services/${stored}`;
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
