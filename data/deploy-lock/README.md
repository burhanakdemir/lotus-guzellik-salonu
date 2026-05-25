# Deploy kilidi (sabit hizmetler + görseller)

Canlıda hizmet listesi ve `public/services/` görselleri **bu repodan** gelir; her deploy'da değişmez.

## Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `services-db.json` | Sabit hizmet listesi (katalog; DB dolu ve eksiksizse DB) |
| `public/services/**` | JPG + SVG (git'te sabit) |

## Güncelleme (bilinçli)

```bash
npm run deploy-lock:export   # DB veya katalog → services-db.json
npm run assets:sync        # görselleri doğrula (indirme yerel)
git add data/deploy-lock public/services
```

## Canlıda

- `prod-setup` **katalog senkronu çalıştırmaz**
- Görseller build'de **indirilmez**, sadece doğrulanır
- DB yalnızca **boşsa** deploy kilidi yüklenir
- `RUN_SEED=true` yalnızca bilinçli sıfırlama için
