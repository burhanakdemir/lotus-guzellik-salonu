/** İstemci + sunucu — yalnızca URL dönüşümü (fs yok) */

export type UploadSubdir = "services" | "gallery" | "reviews" | "promotions";

export function uploadPublicUrl(subdir: UploadSubdir, filename: string): string {
  return `/api/files/${subdir}/${filename}`;
}

export function resolveUploadPublicUrl(stored: string): string {
  if (stored.startsWith("/api/files/")) return stored;
  if (stored.startsWith("/uploads/")) {
    return `/api/files${stored.slice("/uploads".length)}`;
  }
  if (stored.startsWith("/")) return stored;
  return `/api/files/services/${stored}`;
}
