/**
 * Salon hizmet kataloğu — ana kategoriler ve alt hizmetler.
 * Fiyat ve süreler başlangıç değeridir; admin panelden güncellenebilir.
 */

export type ServiceCatalogItem = {
  name: string;
  slug: string;
  category: string;
  duration: number;
  price: number;
  featured?: boolean;
};

function cat(
  category: string,
  items: { name: string; slug: string; duration: number; price: number; featured?: boolean }[]
): ServiceCatalogItem[] {
  return items.map((i) => ({ ...i, category }));
}

export const servicesCatalog: ServiceCatalogItem[] = [
  ...cat("fon-bakim", [
    { name: "Fön", slug: "fon", duration: 45, price: 300, featured: true },
    { name: "Fön Bakım", slug: "fon-bakim", duration: 60, price: 400 },
    { name: "Maske", slug: "maske-bakim", duration: 45, price: 350 },
    { name: "Tepeden", slug: "tepeden", duration: 30, price: 250 },
    { name: "Keratin Bakım", slug: "keratin-bakim", duration: 90, price: 900, featured: true },
    { name: "Botoks Bakım", slug: "botoks-bakim", duration: 60, price: 650 },
    { name: "Saç Yıkama", slug: "sac-yikama", duration: 30, price: 200 },
  ]),
  ...cat("kesim", [
    { name: "Saç Kesimi", slug: "sac-kesimi", duration: 45, price: 350, featured: true },
    { name: "Kahkül Kesimi", slug: "kahkul-kesimi", duration: 20, price: 150 },
  ]),
  ...cat("renklendirme", [
    { name: "Dip Boya", slug: "dip-boya", duration: 90, price: 550 },
    { name: "Dip Açma", slug: "dip-acma", duration: 120, price: 700 },
    { name: "Bütün Boya", slug: "butun-boya", duration: 150, price: 1100, featured: true },
    { name: "Bütün Açma", slug: "butun-acma", duration: 180, price: 1400 },
    { name: "Ombre", slug: "ombre", duration: 150, price: 1200, featured: true },
    { name: "Sombre", slug: "sombre", duration: 150, price: 1200, featured: true },
    { name: "Röfle", slug: "rofle", duration: 120, price: 950 },
    { name: "Balyaj", slug: "balyaj", duration: 150, price: 1300, featured: true },
    { name: "Işıltı", slug: "isilti", duration: 120, price: 1000 },
    { name: "Renklendirme", slug: "renklendirme", duration: 90, price: 800 },
    { name: "Cila", slug: "cila", duration: 45, price: 400 },
    { name: "Bitkisel Boya", slug: "bitkisel-boya", duration: 120, price: 1000 },
    { name: "Organik Boya", slug: "organik-boya", duration: 120, price: 1100 },
    { name: "Pigmentasyon", slug: "pigmentasyon", duration: 90, price: 850 },
  ]),
  ...cat("kalici-sekillendirme", [
    { name: "Perma", slug: "perma", duration: 150, price: 900 },
    { name: "Defrize", slug: "defrize", duration: 180, price: 1200, featured: true },
    { name: "Keratin", slug: "keratin-kalici", duration: 120, price: 950 },
  ]),
  ...cat("gecici-sekillendirme", [
    { name: "Maşa", slug: "masa", duration: 45, price: 350 },
    { name: "Topuz", slug: "topuz", duration: 60, price: 450 },
    { name: "Örgü", slug: "orgu", duration: 60, price: 400 },
    { name: "Gelin Başı", slug: "gelin-basi", duration: 180, price: 2500, featured: true },
    { name: "Nişan Başı", slug: "nisan-basi", duration: 120, price: 1500, featured: true },
    { name: "Kına Başı", slug: "kina-basi", duration: 90, price: 1200 },
    { name: "Mezuniyet Başı", slug: "mezuniyet-basi", duration: 90, price: 1000 },
  ]),
  ...cat("sac-uzatma", [
    { name: "Kaynak", slug: "kaynak", duration: 240, price: 3500, featured: true },
    { name: "Çıt Çıt", slug: "cit-cit", duration: 60, price: 800 },
  ]),
  ...cat("el-ayak-bakim", [
    { name: "Manikür", slug: "manikur", duration: 45, price: 300, featured: true },
    { name: "Pedikür", slug: "pedikur", duration: 60, price: 350, featured: true },
    { name: "Kalıcı Oje", slug: "kalici-oje", duration: 75, price: 450 },
    { name: "Protez Tırnak", slug: "protez-tirnak", duration: 120, price: 600, featured: true },
    { name: "Tırnak Süsleme", slug: "tirnak-susleme", duration: 30, price: 200 },
    { name: "El Bakımı", slug: "el-bakimi", duration: 45, price: 280 },
    { name: "Ayak Bakımı", slug: "ayak-bakimi", duration: 60, price: 320 },
    { name: "Nasır Tedavisi", slug: "nasir-tedavisi", duration: 45, price: 350 },
  ]),
  ...cat("makyaj-guzellik", [
    { name: "Günlük Makyaj", slug: "gunluk-makyaj", duration: 45, price: 400, featured: true },
    { name: "Gece Makyajı", slug: "gece-makyaji", duration: 60, price: 550 },
    { name: "Gelin Makyajı", slug: "gelin-makyaji", duration: 120, price: 2000, featured: true },
    { name: "Nişan Makyajı", slug: "nisan-makyaji", duration: 90, price: 1200 },
    { name: "Porselen Makyaj", slug: "porselen-makyaj", duration: 75, price: 700 },
    { name: "Kaş Dizayn", slug: "kas-dizayn", duration: 30, price: 200, featured: true },
    { name: "Kaş Alımı", slug: "kas-alimi", duration: 20, price: 150 },
    { name: "Dudak Üstü", slug: "dudak-ustu", duration: 15, price: 100 },
    { name: "Yüz Alımı", slug: "yuz-alimi", duration: 30, price: 250 },
  ]),
  ...cat("cilt-bakimi", [
    { name: "Klasik Cilt Bakımı", slug: "klasik-cilt-bakimi", duration: 75, price: 550, featured: true },
    { name: "Medikal Cilt Bakımı", slug: "medikal-cilt-bakimi", duration: 90, price: 700 },
    { name: "Hydrafacial", slug: "hydrafacial", duration: 60, price: 800, featured: true },
    { name: "Dermapen", slug: "dermapen", duration: 60, price: 750 },
    { name: "Kimyasal Peeling", slug: "kimyasal-peeling", duration: 45, price: 600 },
  ]),
  ...cat("kalici-makyaj", [
    { name: "Microblading", slug: "microblading", duration: 120, price: 2500, featured: true },
    { name: "Dudak Renklendirme", slug: "dudak-renklendirme", duration: 90, price: 1800 },
    { name: "Dipliner", slug: "dipliner", duration: 90, price: 1500 },
    { name: "Eyeliner", slug: "eyeliner-kalici", duration: 90, price: 1500 },
  ]),
  ...cat("lazer-epilasyon", [
    { name: "Lazer Epilasyon – Tüm Vücut", slug: "lazer-tum-vucut", duration: 90, price: 2500, featured: true },
    { name: "Lazer Epilasyon – Yarım Bacak", slug: "lazer-yarim-bacak", duration: 45, price: 600 },
    { name: "Lazer Epilasyon – Tüm Bacak", slug: "lazer-tum-bacak", duration: 60, price: 900, featured: true },
    { name: "Lazer Epilasyon – Koltuk Altı", slug: "lazer-koltuk-alti", duration: 20, price: 350, featured: true },
    { name: "Lazer Epilasyon – Genital Bölge", slug: "lazer-genital", duration: 30, price: 500 },
    { name: "Lazer Epilasyon – Özel Bölge", slug: "lazer-ozel-bolge", duration: 30, price: 500 },
    { name: "Lazer Epilasyon – Yüz", slug: "lazer-yuz", duration: 30, price: 400, featured: true },
    { name: "Lazer Epilasyon – Göbek Üzeri", slug: "lazer-gobek-ustu", duration: 20, price: 300 },
    { name: "Lazer Epilasyon – Göğüs", slug: "lazer-gogus", duration: 25, price: 350 },
    { name: "Lazer Epilasyon – Sırt", slug: "lazer-sirt", duration: 40, price: 550 },
    { name: "Lazer Epilasyon – Bel", slug: "lazer-bel", duration: 25, price: 350 },
    { name: "Lazer Epilasyon – Ayak ve Eller", slug: "lazer-ayak-eller", duration: 30, price: 400 },
    {
      name: "Lazer Epilasyon – Kol (diğer alanlar)",
      slug: "lazer-kol-diger",
      duration: 30,
      price: 400,
    },
  ]),
  ...cat("agda-hizmetleri", [
    { name: "Ağda – Tüm Vücut", slug: "agda-tum-vucut", duration: 90, price: 1100, featured: true },
    { name: "Ağda – Yarım Bacak", slug: "agda-yarim-bacak", duration: 45, price: 280 },
    { name: "Ağda – Tüm Bacak", slug: "agda-tum-bacak", duration: 60, price: 420, featured: true },
    { name: "Ağda – Koltuk Altı", slug: "agda-koltuk-alti", duration: 20, price: 180, featured: true },
    { name: "Ağda – Genital Bölge", slug: "agda-genital", duration: 30, price: 220 },
    { name: "Ağda – Özel Bölge", slug: "agda-ozel-bolge", duration: 30, price: 220 },
    { name: "Ağda – Yüz", slug: "agda-yuz", duration: 30, price: 200, featured: true },
    { name: "Ağda – Göbek Üzeri", slug: "agda-gobek-ustu", duration: 20, price: 150 },
    { name: "Ağda – Göğüs", slug: "agda-gogus", duration: 25, price: 180 },
    { name: "Ağda – Sırt", slug: "agda-sirt", duration: 40, price: 280 },
    { name: "Ağda – Bel", slug: "agda-bel", duration: 25, price: 180 },
    { name: "Ağda – Ayak ve Eller", slug: "agda-ayak-eller", duration: 30, price: 200 },
    {
      name: "Ağda – Kol (diğer alanlar)",
      slug: "agda-kol-diger",
      duration: 30,
      price: 200,
    },
  ]),
];

export const catalogSlugs = servicesCatalog.map((s) => s.slug);
