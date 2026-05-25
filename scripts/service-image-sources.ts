/**
 * Pexels fotoğraf ID'leri — kategori ve öne çıkan hizmetler için.
 * https://www.pexels.com (ücretsiz kullanım)
 * Not: Aynı ID farklı kategorilerde kullanılmamalı (banner tekrarlar).
 */

export const PEXELS_QUERY =
  "auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop";

export function pexelsUrl(photoId: number): string {
  return `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?${PEXELS_QUERY}`;
}

/** Kategori banner görselleri (her biri farklı, salon/spa temalı) */
export const categoryPhotoIds: Record<string, number> = {
  "fon-bakim": 1319460,
  kesim: 3738345,
  renklendirme: 2860711,
  "kalici-sekillendirme": 3993449,
  "gecici-sekillendirme": 2658508,
  "sac-uzatma": 1036621,
  "el-ayak-bakim": 3997981,
  "makyaj-guzellik": 2533266,
  "cilt-bakimi": 3757942, // yüz / spa masajı
  "kalici-makyaj": 5069344,
  "lazer-epilasyon": 5069437,
  "agda-hizmetleri": 3992873, // güzellik salonu
};

/** Alt hizmete özel görseller (kategori varsayılanından farklı) */
export const slugPhotoIds: Record<string, number> = {
  fon: 1319460,
  "fon-bakim": 3993449,
  "maske-bakim": 3757942,
  "keratin-bakim": 3993449,
  "sac-yikama": 1319460,
  "kahkul-kesimi": 3738345,
  "dip-boya": 2860711,
  "dip-acma": 2860711,
  "butun-boya": 2860711,
  "ombre": 2860711,
  sombre: 2860711,
  balyaj: 15962973,
  rofle: 15962973,
  isilti: 15962973,
  perma: 3993449,
  defrize: 3993449,
  masa: 1319460,
  topuz: 2658508,
  orgu: 1036621,
  "gelin-basi": 2658508,
  "nisan-basi": 1036621,
  "kina-basi": 3993449,
  "mezuniyet-basi": 1319460,
  kaynak: 1036621,
  "cit-cit": 1036621,
  manikur: 3997981,
  pedikur: 3997982,
  "kalici-oje": 3997981,
  "protez-tirnak": 3997981,
  "tirnak-susleme": 3997982,
  "gunluk-makyaj": 2533266,
  "gece-makyaji": 2533266,
  "gelin-makyaji": 3373736,
  "nisan-makyaji": 3373736,
  "porselen-makyaj": 2533266,
  "kas-dizayn": 5069344,
  "kas-alimi": 5069344,
  "yuz-alimi": 5069344,
  hydrafacial: 3757942,
  dermapen: 3757942,
  "kimyasal-peeling": 3757942,
  microblading: 5069344,
  "dudak-renklendirme": 2533266,
  dipliner: 5069344,
  "eyeliner-kalici": 5069344,
  "lazer-tum-vucut": 5069437,
  "lazer-yarim-bacak": 5069437,
  "lazer-tum-bacak": 5069437,
  "lazer-koltuk-alti": 5069437,
  "lazer-yuz": 5069344,
  "agda-tum-vucut": 3992873,
  "agda-yarim-bacak": 775515,
  "agda-tum-bacak": 775515,
  "agda-koltuk-alti": 3992873,
  "agda-yuz": 5069344,
};

export function photoIdForService(slug: string, category: string): number {
  return slugPhotoIds[slug] ?? categoryPhotoIds[category] ?? 3757942;
}

/** Eski / hatalı Pexels ID'leri — yeniden indirme için */
export const deprecatedPhotoIds = new Set([3782099, 775009]);
