# Tema 1 — LOTUS ana sayfa stili

Bu klasör, onaylanmış **ana sayfa / public site** görünümünün tam yedeğidir.

**Kayıt tarihi:** 2026-05-21

## İçerik

| Dosya | Açıklama |
|-------|----------|
| `src/app/globals.css` | Lotus renk paleti, butonlar, kartlar |
| `src/app/layout.tsx` | Cormorant + DM Sans fontları |
| `src/app/page.tsx` | Hero, kampanyalar, öne çıkan hizmetler, CTA |
| `src/components/WeeklyPromotions.tsx` | Haftanın kampanyaları paneli |
| `src/components/Header.tsx` | Üst menü |
| `src/components/Footer.tsx` | Alt bilgi |
| `src/components/ServiceCard.tsx` | Hizmet kartları (altın çerçeve) |
| `public/hero-bg.svg` | Hero arka plan |
| `public/promo-placeholder.svg` | Kampanya varsayılan görseli |

## Geri yükleme

Terminal:

```bash
npm run theme:restore-tema1
```

Cursor’da sohbet:

> **tema1'e dön** veya **tema1 geri yükle**

Agent `npm run theme:restore-tema1` çalıştırmalı veya `themes/tema1/` dosyalarını `src/` üzerine kopyalamalıdır.

## Yedeği güncelleme

Mevcut stili yeni tema1 olarak kaydetmek için:

```bash
npm run theme:save-tema1
```
