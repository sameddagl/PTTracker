# PTTracker

PT ve pilates eğitmenleri için danışan, paket, ders ve ödeme takibi. Mobil öncelikli bir PWA.
Pazar araştırması ve ürün kararları için [PAZAR_ARASTIRMASI.md](PAZAR_ARASTIRMASI.md).

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui · Supabase (Auth + Postgres, Frankfurt) · Drizzle ORM

## Kurulum

Node 22+ ve pnpm gerekir.

```bash
pnpm install
cp .env.example .env.local
```

### 1. Supabase projesi
1. [supabase.com](https://supabase.com) üzerinden yeni bir proje aç. Bölge: **Central EU (Frankfurt)**.
2. Proje sayfasının üstündeki **Connect** butonuna tıkla.
   - **App Frameworks** sekmesinde Next.js'i seç. Buradaki URL'yi `NEXT_PUBLIC_SUPABASE_URL`, publishable key'i (`sb_publishable_…`) `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` olarak yaz.
   - Anahtarların hepsi **Project Settings → API Keys** altında da duruyor. Publishable key yoksa oradaki legacy `anon` key de çalışır.
3. Aynı **Connect** penceresinde **Connection String** sekmesine geç:
   - **Transaction pooler** (port 6543) adresini `DATABASE_URL` olarak yaz.
   - *(İsteğe bağlı)* **Session pooler** (port 5432) adresini `DATABASE_URL_DIRECT` olarak yaz. Boş bırakırsan migration'lar `DATABASE_URL`'i 5432 portuyla kullanır. **Direct connection**'ı kullanma: yalnızca IPv6 destekler, çoğu ev ağında bağlanamaz.
   - `[YOUR-PASSWORD]` yerine proje açılırken belirlediğin veritabanı şifresini yaz. Unuttuysan **Project Settings → Database → Reset database password** ile yenileyebilirsin.
4. Danışan portal linkleri için bir gizli anahtar üret ve `PORTAL_SECRET` olarak yaz:
   ```bash
   openssl rand -base64 32
   ```
   Bu değer değişirse daha önce paylaşılan tüm linkler geçersiz olur. Canlı ortamda ayrı bir değer kullan.
5. Migration'ları uygula:
   ```bash
   pnpm db:migrate
   pnpm db:check   # tabloları, RLS'i, view'ı ve trigger'ı doğrular
   ```

### 2. Auth ayarları (Supabase Dashboard → Authentication)
- **URL Configuration**:
  - Site URL: `http://localhost:3000` (canlıda gerçek domain)
  - Redirect URLs: `http://localhost:3000/auth/**`
- **Sign In / Providers → Email**: *Email OTP Length* değerini `6` yap.
- **Emails → Templates**: Giriş e-postası 6 haneli kodu içermeli. **Magic Link** şablonunda kodu içeren şu gövdeyi kullan (link, yedek olarak kalıyor):
  ```html
  <h2>Giriş kodun</h2>
  <p style="font-size:28px;font-weight:600;letter-spacing:6px">{{ .Token }}</p>
  <p>Kod 1 saat geçerli. İstersen <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">bu bağlantıyla</a> da girebilirsin.</p>
  ```
  İlk kez giriş yapan kullanıcılara **Confirm signup** şablonu gidiyor. Aynı gövdeyi oraya da koy, yalnızca linkteki `type=email`'i `type=signup` yap.
- **SMTP**: Supabase'in yerleşik e-posta servisi saatte 2 e-posta ile sınırlı. Alan adı yoksa Gmail kullanılabilir: *Emails → SMTP Settings*'te host `smtp.gmail.com`, port `465`, şifre olarak Gmail uygulama şifresi. Sonra *Rate Limits*'ten e-posta limitini yükselt.
- **Önerilen**: Uygulama veritabanına yalnızca sunucudan eriştiği için *Data API*'yi kapatabilirsin (Project Settings → Data API). RLS açık kalır.

### 3. Çalıştır
```bash
pnpm dev
```

## Komutlar
| Komut | Açıklama |
|---|---|
| `pnpm dev` | Geliştirme sunucusu |
| `pnpm build` | Production build |
| `pnpm typecheck` / `pnpm lint` | Tip kontrolü / lint |
| `pnpm test` | Tüm testler (`test:db` + `test:logic`) |
| `pnpm test:logic` | Paket seçimi, telafi hakkı, yoklama ve saat dilimi mantığını gerçek fonksiyonlarla test eder |
| `pnpm test:db` | Migration'ları bellek içi Postgres'e (PGlite) uygular. RLS izolasyonunu ve paket bakiyesi hesabını test eder. Supabase gerektirmez |
| `pnpm db:generate` | `src/db/schema.ts` değişikliğinden yeni migration üretir |
| `pnpm db:migrate` | Migration'ları Supabase'e uygular |
| `pnpm db:check` | Canlı veritabanını salt okunur olarak kontrol eder (RLS, view, trigger) |

## Mimari notlar
- **Çok kiracılık:**
  - Her tabloda `trainer_id` var ve RLS politikası `trainer_id = auth.uid()`.
  - Composite foreign key'ler (`(client_id, trainer_id)` vb.) bir trainer'ın başka bir trainer'ın kaydına bağlanmasını engeller. FK kontrolleri RLS'i atladığı için bu gerekli.
- **Giriş:** E-postaya gelen 6 haneli kod ([src/app/giris](src/app/giris)). Ana ekrana eklenmiş iOS uygulamasında link Safari'de açıldığı için oturum uygulamaya geçmiyor; kod bu sorunu çözüyor. Aynı e-postadaki link yedek olarak çalışır.
- **Veri erişimi:**
  - Sunucu kodu `withTrainer(async (tx, trainerId) => …)` ([src/db/index.ts](src/db/index.ts)) kullanır.
  - Bu fonksiyon JWT'yi doğrular, transaction içinde `authenticated` rolüne geçer. Böylece Drizzle sorguları da RLS'e tabidir.
  - `adminDb` RLS'i atlar ve yalnızca danışan portalı gibi oturumsuz yollarda kullanılır.
- **Paket bakiyesi:**
  - Tek doğruluk kaynağı `lesson_attendees.consumes_credit` (geldi / gelmedi / telafi hakkı kullanılmamış geç iptal).
  - `client_package_balances` view'ı kalan dersi, dondurmayla uzayan son tarihi, ödenen ve kalan tutarı ve durumu hesaplar.
- **Danışan portalı:** `/p/<token>` salt okunurdur ve giriş gerektirmez.
  - Token, link kaydının id'sinden `PORTAL_SECRET` ile HMAC olarak türetilir. Bu sayede trainer aynı linki istediği zaman tekrar kopyalayabilir.
  - Veritabanında yalnızca token'ın SHA-256 hash'i tutulur; anahtar olmadan sızan veritabanından çalışan link üretilemez.
  - "Yenile" eski linki geçersiz kılar. WhatsApp hatırlatmaları aktif linki mesajın sonuna ekler.
- **WhatsApp:** MVP'de `wa.me` linkleri kullanılır ([src/lib/whatsapp.ts](src/lib/whatsapp.ts)). Onay veya şirket gerektirmez.
- **KVKK:** Sağlık notları opsiyoneldir ve danışanın açık rızasıyla kaydedilir (`consents` tablosu). [KVKK metni](src/app/kvkk/page.tsx) taslaktır, hukuki inceleme gerekiyor.
