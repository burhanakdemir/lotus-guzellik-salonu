# Tema 2 — LOTUS public site (güncel görünüm)

Bu klasör, **müşteri tarafı** (ana sayfa, hizmetler, randevu, galeri, hesabım vb.) sayfa yapısı ve stillerinin tam yedeğidir.

**Kayıt:** `npm run theme:save-tema2` ile güncellenir.

## Kapsam

| Alan | İçerik |
|------|--------|
| `src/app/` | `globals.css`, `layout.tsx`, ana sayfa + tüm public `page.tsx` dosyaları |
| `src/components/` | Header, Footer, ServiceCard, RandevuForm, CategoryImage, hesap/galeri/yorum bileşenleri (admin hariç) |
| `src/lib/` | `group-services-by-category.ts`, `service-categories.ts` |
| `prisma/` | `services-catalog.ts` |
| `data/` | `services-db.json` — admin panelden düzenlenmiş hizmetlerin anlık görüntüsü |
| `public/` | `hero-bg.svg`, `promo-placeholder.svg`, `services/` (kategori + hizmet SVG) |

`theme:save-tema2` kaynak dosyalarını **değiştirmez**; yalnızca `themes/tema2/` altına kopyalar.

**Dahil değil:** Admin panel (`src/app/admin/`, `src/components/admin/`, `admin.css`), API route’ları, veritabanı.

## Geri yükleme

Terminal:

```bash
npm run theme:restore-tema2
```

Cursor’da sohbet:

> **tema2'ye dön** veya **tema2 geri yükle**

## Yedeği güncelleme

Mevcut public site görünümünü yeni tema2 olarak kaydetmek için:

```bash
npm run theme:save-tema2
```

## Tema 1 ile fark

- **Tema 1:** Eski / minimal ana sayfa seti (9 dosya).
- **Tema 2:** Kategorik hizmetler sayfası, gelişmiş randevu formu, tüm public sayfalar ve ilgili bileşenler.
