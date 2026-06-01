import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { servicesCatalog } from "../../prisma/services-catalog";

/** Katalogdan DB yokken hizmet listesi */
export function catalogServicesFallback() {
  return servicesCatalog.map((s) => ({
    id: `catalog-${s.slug}`,
    name: s.name,
    slug: s.slug,
    category: s.category,
    description: `${s.name} hizmetimiz profesyonel ekip ve kaliteli ürünlerle sunulmaktadır.`,
    durationMinutes: s.duration,
    price: s.price,
    imageUrl: null as string | null,
    isActive: true,
    isFeatured: s.featured ?? false,
    showPricePublic: true,
    showPriceOnHomepage: s.featured ?? false,
    deletedAt: null as Date | null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  }));
}

/** Seed ile aynı varsayılan salon bilgileri (DB kapalıyken) */
export const DEFAULT_SALON_SETTINGS = {
  id: "default",
  salonName: "LOTUS BAYANKUAFÖRÜ & GÜZELLİK SALONU",
  city: "ANTALYA",
  address: "Fevziçakmak Mahallesi Akşemsettin Caddesi No:12/A Kepez / ANTALYA",
  phone: "0532 394 36 86",
  heroTitle: "Güzelliğinize Değer Katıyoruz",
  heroSubtitle:
    "Antalya Kepez'de profesyonel kuaför ve güzellik hizmetleri. Online randevu alın, haftanın kampanyalarından yararlanın.",
  showServicePrice: true,
  showServiceDuration: true,
  mondayOpen: "09:00",
  mondayClose: "19:00",
  tuesdayOpen: "09:00",
  tuesdayClose: "19:00",
  wednesdayOpen: "09:00",
  wednesdayClose: "19:00",
  thursdayOpen: "09:00",
  thursdayClose: "19:00",
  fridayOpen: "09:00",
  fridayClose: "19:00",
  saturdayOpen: "09:00",
  saturdayClose: "18:00",
  sundayOpen: null as string | null,
  sundayClose: null as string | null,
  aboutContent:
    "LOTUS BAYANKUAFÖRÜ & GÜZELLİK SALONU olarak Antalya Kepez'de kadınların güzellik ve bakım ihtiyaçlarını tek çatı altında karşılıyoruz.",
  instagram: null as string | null,
  facebook: null as string | null,
  slotInterval: 30,
  showcaseImage1: null as string | null,
  showcaseImage2: null as string | null,
  showcaseImage3: null as string | null,
  showcaseImage4: null as string | null,
} as const;

export function isDbConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "PrismaClientInitializationError" ||
    error.message.includes("Can't reach database server") ||
    error.message.includes("Connection refused") ||
    error.message.includes("ECONNREFUSED")
  );
}

export async function safeDbQuery<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (isDbConnectionError(error)) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[db] PostgreSQL erişilemiyor (localhost:5434). Docker: npm run docker:up"
        );
      }
      return fallback;
    }
    throw error;
  }
}

export const getSalonSettingsSafe = cache(async () => {
  return safeDbQuery(
    () => prisma.salonSettings.findUnique({ where: { id: "default" } }),
    { ...DEFAULT_SALON_SETTINGS }
  );
});
