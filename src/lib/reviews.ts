import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { getUploadSubdir, uploadPublicUrl } from "./uploads";
import {
  isReviewImageFile,
  MEMBER_MAX_REVIEW_IMAGES,
  REVIEW_IMAGE_MAX_BYTES,
} from "./review-display";

export {
  REVIEW_IMAGE_MAX_BYTES,
  isReviewImageFile,
  MEMBER_MAX_REVIEW_IMAGES,
  GUEST_MAX_REVIEW_IMAGES,
} from "./review-display";

export async function saveReviewImages(reviewId: string, files: File[]): Promise<string[]> {
  const uploadDir = getUploadSubdir("reviews");
  await mkdir(uploadDir, { recursive: true });

  const urls: string[] = [];
  const stamp = Date.now();
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${reviewId}-${stamp}-${i}.${ext}`;
    await writeFile(
      path.join(uploadDir, filename),
      Buffer.from(await file.arrayBuffer())
    );
    urls.push(uploadPublicUrl("reviews", filename));
  }
  return urls;
}

function reviewImageDiskPath(imageUrl: string): string | null {
  const prefixUploads = "/uploads/reviews/";
  const prefixApi = "/api/files/reviews/";
  let rel: string | null = null;
  if (imageUrl.startsWith(prefixUploads)) rel = imageUrl.slice(prefixUploads.length);
  else if (imageUrl.startsWith(prefixApi)) rel = imageUrl.slice(prefixApi.length);
  if (!rel) return null;
  return path.join(getUploadSubdir("reviews"), rel);
}

export async function deleteReviewImage(imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl) return;
  const filePath = reviewImageDiskPath(imageUrl);
  if (!filePath) return;
  await unlink(filePath).catch(() => {});
}

export async function deleteReviewImages(imageUrls: string[] | null | undefined): Promise<void> {
  if (!imageUrls?.length) return;
  await Promise.all(imageUrls.map((url) => deleteReviewImage(url)));
}

export function parseReviewImageFiles(formData: FormData): File[] {
  const files: File[] = [];

  for (let i = 0; i < MEMBER_MAX_REVIEW_IMAGES; i++) {
    const item = formData.get(`image_${i}`);
    if (item instanceof File && item.size > 0) files.push(item);
  }
  if (files.length > 0) return files;

  for (const item of formData.getAll("images")) {
    if (item instanceof File && item.size > 0) files.push(item);
  }

  const legacy = formData.get("image");
  if (legacy instanceof File && legacy.size > 0 && files.length === 0) {
    files.push(legacy);
  }

  return files;
}

export function validateReviewImageFiles(
  files: File[],
  maxCount: number
): string | null {
  if (files.length > maxCount) {
    return maxCount === 1
      ? "En fazla 1 resim yükleyebilirsiniz."
      : `En fazla ${maxCount} resim yükleyebilirsiniz.`;
  }
  for (const file of files) {
    if (file.size > REVIEW_IMAGE_MAX_BYTES) {
      return "Resim çok büyük (en fazla 5 MB).";
    }
    if (!isReviewImageFile(file)) {
      return "Desteklenen formatlar: JPG, PNG, WEBP, GIF.";
    }
  }
  return null;
}

export function parseKeepImageUrls(formData: FormData, existing: string[]): string[] {
  const raw = formData.get("keepImageUrls");
  if (typeof raw !== "string" || !raw.trim()) return existing;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return existing;
    const allowed = new Set(existing);
    return parsed.filter((url): url is string => typeof url === "string" && allowed.has(url));
  } catch {
    return existing;
  }
}
