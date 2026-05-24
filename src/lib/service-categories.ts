/** Ana hizmet kategorileri (resimdeki başlıklar) */
export const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  "fon-bakim": "Fön ve Bakım Hizmetleri",
  kesim: "Kesim Hizmetleri",
  renklendirme: "Renklendirme Hizmetleri",
  "kalici-sekillendirme": "Kalıcı Şekillendirme Hizmetleri",
  "gecici-sekillendirme": "Geçici Şekillendirme Hizmetleri",
  "sac-uzatma": "Saç Uzatma Hizmetleri",
  "el-ayak-bakim": "El ve Ayak Bakım Hizmetleri",
  "makyaj-guzellik": "Makyaj ve Güzellik Hizmetleri",
  "cilt-bakimi": "Cilt Bakımı Hizmetleri",
  "kalici-makyaj": "Kalıcı Makyaj Hizmetleri",
  "lazer-epilasyon": "Lazer Epilasyon Hizmetleri",
  "agda-hizmetleri": "Ağda Hizmetleri",
};

export const SERVICE_CATEGORY_ORDER = [
  "fon-bakim",
  "kesim",
  "renklendirme",
  "kalici-sekillendirme",
  "gecici-sekillendirme",
  "sac-uzatma",
  "el-ayak-bakim",
  "makyaj-guzellik",
  "cilt-bakimi",
  "kalici-makyaj",
  "lazer-epilasyon",
  "agda-hizmetleri",
] as const;

export type ServiceCategorySlug = (typeof SERVICE_CATEGORY_ORDER)[number];

export function getServiceCategoryLabel(category: string): string {
  return SERVICE_CATEGORY_LABELS[category] ?? category;
}
