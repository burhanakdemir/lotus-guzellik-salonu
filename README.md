# LOTUS Bayankuaförü & Güzellik Salonu

Antalya Kepez için Türkçe arayüzlü kuaför ve güzellik merkezi web uygulaması. Online randevu, üyelik, haftalık kampanyalar ve admin paneli içerir.

## Özellikler

- **Ana sayfa:** Hero, öne çıkan hizmetler, haftalık kampanya, Randevu Al CTA
- **Hizmetler:** Tüm hizmetler (görsel, süre, fiyat — KDV dahil ₺)
- **Hakkımızda:** Salon bilgisi, çalışma saatleri, harita
- **Randevu:** Üye veya misafir (telefon + ad); hizmet, tarih, müsait saat seçimi; süreye göre slot hesaplama
- **Üyelik:** Kayıt, giriş, hesabım (randevular, indirimler)
- **Admin paneli:** Hizmet CRUD, görsel yükleme, fiyat/süre, kampanyalar, üye indirimleri, randevu yönetimi, salon ayarları

## Kurulum

**Docker Desktop** açık olmalı (PostgreSQL veritabanı).

```bash
npm install
cp .env.example .env
npm run db:setup
npm run images:download
npm run dev
```

Veya adım adım:

```bash
npm run docker:up
npm run db:push
npm run db:seed
```

Tarayıcı: [http://localhost:3000](http://localhost:3000)

## Ana sayfa teması (Tema 1)

**Tema 1** (eski ana sayfa): `themes/tema1/`

- Geri yükle: `npm run theme:restore-tema1` veya Cursor’da **tema1'e dön**
- Yedeği güncelle: `npm run theme:save-tema1`
- Ayrıntı: [themes/tema1/README.md](themes/tema1/README.md)

**Tema 2** (güncel public site — tüm müşteri sayfaları): `themes/tema2/`

- Geri yükle: `npm run theme:restore-tema2` veya Cursor’da **tema2'ye dön**
- Yedeği güncelle: `npm run theme:save-tema2`
- Ayrıntı: [themes/tema2/README.md](themes/tema2/README.md)

## Admin girişi

Varsayılan (`.env`):

- **Telefon:** `05323943686` (veya `ADMIN_PHONE`)
- **Şifre:** `Admin123!` (veya `ADMIN_PASSWORD`)
- **URL:** [http://localhost:3000/admin/giris](http://localhost:3000/admin/giris)

## Görsel klasör yapısı

```
public/logo-lotus.png     # Site logosu
public/hero-bg.svg        # Ana sayfa arka plan
public/promo-placeholder.svg
public/services/          # Hizmet fotoğrafları ({slug}.jpg + {slug}.svg yedek)
public/services/categories/  # Kategori banner ({category}.jpg)
public/uploads/           # Admin/yorum yüklemeleri (canlıda kalıcı volume gerekir)
```

Canlıya almadan önce tüm statik görselleri hazırlayın:

```bash
npm run images:prepare   # JPG indir + SVG yedek + logo
npm run images:verify    # Eksik dosya kontrolü
```

`npm run build` öncesinde `ensure-images` çalışır: görseller repoda yoksa otomatik indirilir, varsa doğrulanır.

Admin görsel yüklemezse `public/services/{slug}.jpg` (yoksa `.svg`) kullanılır. Kategori banner’ları için aynı mantık geçerlidir.

## Twilio (ileride SMS)

`.env` içinde `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` tanımlayın. Altyapı: `src/lib/twilio.ts`

## Canlıya alma

Build ve container başlangıcında görseller otomatik hazırlanır (`ensure-images`: doğrula → eksikse Pexels’ten indir + SVG yedek + logo).

### VPS / Node sunucu

```bash
cp .env.example .env   # JWT, admin, DATABASE_URL düzenleyin
npm install
npm run prod:setup     # klasörler + görseller + DB şema + seed (boş DB)
npm run build
npm run start
```

İlk açılışta otomatik kurulum: `npm run start:prod`

### Docker (önerilen)

```bash
cp .env.example .env   # JWT_SECRET, ADMIN_*, POSTGRES_PASSWORD zorunlu
npm run docker:prod
```

Container her başladığında:
1. Upload klasörleri oluşturulur
2. Görseller doğrulanır (repoda JPG/SVG varsa ağ gerekmez)
3. PostgreSQL şeması uygulanır
4. Seed **yalnızca boş veritabanında** veya `RUN_SEED=true` iken çalışır (admin düzenlemeleri korunur)

**İlk canlı kurulum:** `.env` içinde `RUN_SEED=true` ile bir kez başlatın.

Admin yüklemeleri (galeri, yorum, özel hizmet fotoğrafı) `lotus_uploads` volume’unda kalıcıdır — yedekleyin.

Statik hizmet/kategori görselleri Docker imajında `public/services/` içindedir; deploy öncesi `npm run images:prepare` çalıştırıp JPG’leri repoya eklemeniz önerilir.

### Render + Neon (önerilen canlı — ~$7/ay)

Render PostgreSQL yerine **Neon** (ücretsiz DB) kullanılır. Tahmini maliyet:

| Bileşen | Maliyet |
|---------|---------|
| Neon PostgreSQL | $0 (Free tier) |
| Render Web (Starter) | ~$7/ay |
| Upload diski (1 GB) | ~$0.25/ay |
| **Toplam** | **~$7.25/ay** |

**1. Neon veritabanı (ücretsiz)**

1. [neon.tech](https://neon.tech) → GitHub ile kayıt
2. **New Project** → bölge: **Frankfurt (eu-central-1)**
3. **Connection details** → iki URL kopyalayın:
   - **Pooled** → Render `DATABASE_URL`
   - **Direct** → Render `DIRECT_URL`
4. Her URL’nin sonunda `?sslmode=require` olduğundan emin olun

**2. GitHub push** (zaten yapıldıysa atlayın)

```bash
git push origin main
```

**3. Render Blueprint**

1. [render.com](https://render.com) → **New +** → **Blueprint**
2. Repo: `lotus-guzellik-salonu` → `render.yaml` okunur
3. Sadece **lotus-web** oluşur (PostgreSQL servisi yok — tasarruf)
4. Girin:

| Alan | Değer |
|------|--------|
| `DATABASE_URL` | Neon **Pooled** connection string |
| `DIRECT_URL` | Neon **Direct** connection string |
| `ADMIN_PASSWORD` | Canlı admin şifresi |
| `ADMIN_PHONE` | `05323943686` |

5. **Apply** (~$7/ay onay ekranı)

**4. İlk deploy sonrası**

- Site: `https://lotus-web-xxxx.onrender.com`
- Admin: `/admin/giris`
- Boş Neon DB otomatik seed edilir
- Galeri yüklemeleri Render disk’te kalır

**5. Sonraki deploylar**

`main`’e push → otomatik deploy. Admin düzenlemeleri korunur.

| Ayar | Değer |
|------|--------|
| Build | `npm ci && npm run build` |
| Start | `npm run start:render` |
| Disk | `public/uploads` (1 GB) |
| Bölge | Frankfurt |

Özel domain: **lotus-web** → **Custom Domains** → DNS CNAME.

### Deploy kontrol listesi

| Dosya / komut | Açıklama |
|---------------|----------|
| `npm run images:prepare` | 87 hizmet + 12 kategori JPG/SVG + logo (deploy öncesi, repoya commit) |
| `npm run images:verify` | Eksik dosya kontrolü |
| `npm run prod:setup` | Görseller + DB + hizmet kataloğu |
| `.env` | JWT, DB, admin, VAPID (repoya **eklemeyin**) |

### Güvenlik (canlıda mutlaka değiştirin)

- `JWT_SECRET` — en az 32 karakter
- `ADMIN_PASSWORD` — güçlü şifre
- `POSTGRES_PASSWORD` — Docker canlı DB
- VAPID anahtarları — push bildirimi için (opsiyonel)

## Teknolojiler

Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · Prisma · PostgreSQL (Docker)
