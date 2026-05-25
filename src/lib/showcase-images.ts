import { resolveUploadPublicUrl } from "@/lib/upload-urls";

export const SHOWCASE_SLOT_COUNT = 4;

export type ShowcaseSlot = 1 | 2 | 3 | 4;

export function showcaseFieldKey(slot: ShowcaseSlot): keyof ShowcaseFields {
  return `showcaseImage${slot}` as keyof ShowcaseFields;
}

export type ShowcaseFields = {
  showcaseImage1: string | null;
  showcaseImage2: string | null;
  showcaseImage3: string | null;
  showcaseImage4: string | null;
};

export function getShowcaseUrls(
  settings: Partial<ShowcaseFields> | null | undefined
): (string | null)[] {
  if (!settings) return [null, null, null, null];
  return [1, 2, 3, 4].map((n) => {
    const raw = settings[showcaseFieldKey(n as ShowcaseSlot)] ?? null;
    return raw ? resolveUploadPublicUrl(raw) : null;
  });
}
