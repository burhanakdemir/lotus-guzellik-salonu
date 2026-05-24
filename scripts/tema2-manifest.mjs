/**
 * Tema 2 — public site yedek dosya listesi.
 * Admin panel (src/app/admin/, src/components/admin/) dahil değildir.
 */

export const TEMA2_NAME = "tema2";

/** Kaynak → hedef aynı göreli yol */
export const TEMA2_FILES = [
  // Çekirdek stil ve iskelet
  "src/app/globals.css",
  "src/app/layout.tsx",
  "src/app/page.tsx",

  // Public sayfalar
  "src/app/hizmetler/page.tsx",
  "src/app/randevu/page.tsx",
  "src/app/hakkimizda/page.tsx",
  "src/app/galeri/page.tsx",
  "src/app/yorumlar/page.tsx",
  "src/app/giris/page.tsx",
  "src/app/uye-ol/page.tsx",
  "src/app/hesabim/page.tsx",

  // Public bileşenler
  "src/components/Header.tsx",
  "src/components/Footer.tsx",
  "src/components/ServiceCard.tsx",
  "src/components/WeeklyPromotions.tsx",
  "src/components/RandevuForm.tsx",
  "src/components/CategoryImage.tsx",
  "src/components/ServiceImage.tsx",
  "src/components/CustomerReviews.tsx",
  "src/components/GalleryGrid.tsx",
  "src/components/SalonContactStrip.tsx",
  "src/components/HesabimPanel.tsx",
  "src/components/MemberNotificationsPanel.tsx",
  "src/components/MemberNotificationBell.tsx",
  "src/components/ChangePasswordModal.tsx",
  "src/components/LogoutButton.tsx",
  "src/components/PushNotificationPrompt.tsx",
  "src/components/NotificationPermissionModal.tsx",
  "src/components/LotusLogo.tsx",

  // Hizmetler: kategoriler, katalog sırası, Ağda/Lazer alt hizmetler
  "src/lib/group-services-by-category.ts",
  "src/lib/service-categories.ts",
  "prisma/services-catalog.ts",

  // Statik görseller (kök)
  "public/hero-bg.svg",
  "public/promo-placeholder.svg",
];

/** Tam klasör kopyası (özyinelemeli) — kategori banner + hizmet SVG’leri */
export const TEMA2_DIRS = ["public/services"];
