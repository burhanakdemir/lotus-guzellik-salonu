export type GalleryMediaType = "IMAGE" | "VIDEO";

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const VIDEO_EXT = new Set(["mp4", "webm", "mov", "m4v"]);

export function galleryMediaUrl(mediaUrl: string): string {
  if (mediaUrl.startsWith("/") || mediaUrl.startsWith("http")) return mediaUrl;
  return `/uploads/gallery/${mediaUrl}`;
}

export function mediaTypeFromFilename(filename: string): GalleryMediaType | null {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (IMAGE_EXT.has(ext)) return "IMAGE";
  if (VIDEO_EXT.has(ext)) return "VIDEO";
  return null;
}

export function mediaTypeFromMime(mime: string): GalleryMediaType | null {
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("video/")) return "VIDEO";
  return null;
}

export const GALLERY_MAX_BYTES = 80 * 1024 * 1024; // 80 MB
