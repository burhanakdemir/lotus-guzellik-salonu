import { resolveUploadPublicUrl } from "./upload-urls";
export {
  formatPhoneDisplay,
  normalizePhone,
  whatsappUrl,
} from "./phone";
export { minutesToTime, timeToMinutes } from "./time-format";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function serviceImageUrl(slug: string, imageUrl?: string | null): string {
  if (imageUrl) {
    if (imageUrl.startsWith("/uploads/") || imageUrl.startsWith("/api/files/")) {
      return resolveUploadPublicUrl(imageUrl);
    }
    return imageUrl.startsWith("/") ? imageUrl : resolveUploadPublicUrl(imageUrl);
  }
  return `/services/${slug}.jpg`;
}

/** Kategori kapak görseli (public/services/categories/{category}.jpg) */
export function serviceCategoryImageUrl(category: string): string {
  return `/services/categories/${category}.jpg`;
}

/** Kategori JPG yüklenemezse SVG yer tutucu */
export function serviceCategoryImageFallbackUrl(category: string): string {
  return `/services/categories/${category}.svg`;
}

/** JPG yüklenemezse SVG yer tutucu (istemci tarafı yedek) */
export function serviceImageFallbackUrl(slug: string): string {
  return `/services/${slug}.svg`;
}

export function promotionBannerUrl(bannerUrl?: string | null): string {
  if (bannerUrl) {
    if (bannerUrl.startsWith("/uploads/") || bannerUrl.startsWith("/api/files/")) {
      return resolveUploadPublicUrl(bannerUrl);
    }
    return bannerUrl.startsWith("/") ? bannerUrl : `/api/files/promotions/${bannerUrl}`;
  }
  return "/promo-placeholder.svg";
}

/** Kampanya görseli: önce banner, yoksa ilk bağlı hizmetin fotoğrafı */
export function promotionDisplayImageUrl(promo: {
  bannerUrl?: string | null;
  services?: { service: { slug: string; imageUrl: string | null } }[];
}): string {
  if (promo.bannerUrl) return promotionBannerUrl(promo.bannerUrl);
  const service = promo.services?.[0]?.service;
  if (service) return serviceImageUrl(service.slug, service.imageUrl);
  return promotionBannerUrl(null);
}

export function formatPromotionServicesLabel(promo: {
  allServices: boolean;
  services: { service: { name: string } }[];
}): string {
  if (promo.allServices) {
    return "Tüm hizmetlerde geçerlidir";
  }
  const names = promo.services.map((s) => s.service.name);
  if (names.length === 0) return "Seçili hizmetlerde geçerlidir";
  if (names.length <= 4) return names.join(" · ");
  return `${names.slice(0, 3).join(", ")} ve ${names.length - 3} hizmet daha`;
}

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export function getWorkHoursForDay(
  dayIndex: number,
  settings: {
    mondayOpen: string | null;
    mondayClose: string | null;
    tuesdayOpen: string | null;
    tuesdayClose: string | null;
    wednesdayOpen: string | null;
    wednesdayClose: string | null;
    thursdayOpen: string | null;
    thursdayClose: string | null;
    fridayOpen: string | null;
    fridayClose: string | null;
    saturdayOpen: string | null;
    saturdayClose: string | null;
    sundayOpen: string | null;
    sundayClose: string | null;
  }
): { open: string; close: string } | null {
  const key = DAY_KEYS[dayIndex];
  const open = settings[`${key}Open` as keyof typeof settings] as string | null;
  const close = settings[`${key}Close` as keyof typeof settings] as string | null;
  if (!open || !close) return null;
  return { open, close };
}

