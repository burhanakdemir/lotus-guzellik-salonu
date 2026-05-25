# Tema / CSS neden bozulur?

Sayfa **düz HTML** (mavi linkler, Times font) görünüyorsa Tailwind/CSS yüklenmemiştir. Bu genelde **bozuk `.next` önbelleği**dir; tema dosyaları silinmiş değildir.

## Hızlı çözüm

1. Tüm terminal pencerelerinde çalışan `next dev` süreçlerini kapatın (Ctrl+C).
2. Proje klasöründe:

```powershell
npm run dev:clean
```

3. Tarayıcıda **Ctrl+F5** ile sert yenileyin.

## Neden tekrarlıyor?

| Yapmayın | Neden |
|----------|--------|
| `npm run build` çalışırken `npm run dev` açmak | Aynı `.next` klasörü bozulur |
| Build bitmeden dev’e geçmek | Production + development karışır |
| Eski dev sürecini kapatmadan yeni `npm run dev` | İki süreç aynı önbelleğe yazar |

## Günlük kullanım

| İş | Komut |
|----|--------|
| Geliştirme | `npm run dev` (önbellek modu otomatik kontrol) |
| Tema bozuldu | `npm run dev:clean` |
| Teşhis | `npm run doctor` |
| Canlıya build | `npm run build` (dev’i otomatik durdurur) |
| Build sonrası test | `npm run start` — tekrar kod için `npm run dev` |

## Hâlâ düzelmezse

- Cursor/VS Code’u kapatıp yalnızca bir terminalde `npm run dev:clean`.
- `node_modules/.cache` silmek genelde gerekmez; gerekirse: `.next` silindikten sonra tekrar `dev:clean`.
