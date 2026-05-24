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

### Render + Git (önerilen canlı)

Proje kökünde `render.yaml` Blueprint hazırdır. Akış: GitHub → Render otomatik deploy.

**1. GitHub repo oluşturun ve push edin**

İlk commit hazır. GitHub’a göndermek için (bir kez giriş gerekir):

```bash
gh auth login
gh repo create lotus-guzellik-salonu --public --source=. --remote=origin --push
```

`gh` yoksa: [GitHub CLI](https://cli.github.com/) kurun veya [github.com/new](https://github.com/new) üzerinden `lotus-guzellik-salonu` repo’sunu oluşturup:

```bash
git remote add origin https://github.com/burhanakdemir/lotus-guzellik-salonu.git
git push -u origin main
```

`.env` dosyasını **asla** commit etmeyin (`.gitignore`’da).

**2. Render Blueprint**

1. [render.com](https://render.com) → **New +** → **Blueprint**
2. GitHub repo’yu bağlayın → `render.yaml` otomatik okunur
3. İstendiğinde girin: `ADMIN_PASSWORD`, `ADMIN_PHONE` (ve isteğe bağlı VAPID)
4. **Apply** — PostgreSQL + Web Service + kalıcı disk oluşturulur

**3. İlk deploy sonrası**

- Site: `https://lotus-web-xxxx.onrender.com`
- Admin: `/admin/giris` (`.env.example` / Render env’deki telefon + şifre)
- Boş veritabanı otomatik seed edilir (`prod-setup`)
- Galeri/yorum yüklemeleri disk üzerinde kalır (`public/uploads`)

**4. Sonraki deploylar**

`main` branch’e push → Render otomatik build + deploy. Admin düzenlemeleri korunur (seed atlanır).

| Render ayarı | Değer |
|--------------|--------|
| Build | `npm ci && npm run build` |
| Start | `npm run start:render` |
| Disk | `/opt/render/project/src/public/uploads` (1 GB) |
| Bölge | Frankfurt |
| Node | 20 |

Özel domain: Web Service → **Custom Domains** → DNS CNAME.

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
