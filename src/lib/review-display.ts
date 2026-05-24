export const REVIEW_IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const MEMBER_MAX_REVIEW_IMAGES = 3;
export const GUEST_MAX_REVIEW_IMAGES = 1;

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

export function isReviewImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXT.has(ext);
}

export function reviewImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("/") || imageUrl.startsWith("http")) return imageUrl;
  return `/uploads/reviews/${imageUrl}`;
}

export function reviewImageUrls(imageUrls: string[] | null | undefined): string[] {
  if (!imageUrls?.length) return [];
  return imageUrls
    .map((url) => reviewImageUrl(url))
    .filter((url): url is string => Boolean(url));
}
