# Canlıya Çıkış Listesi

> Stüdyom'u ilk gerçek eğitmenlere açmadan önce yapılacaklar. Sıra önemli: üstteki adımlar alttakilerin ön koşulu.
> Hukuki maddeler bilgi amaçlıdır; KVKK avukatı ve mali müşavir görüşünün yerini tutmaz.

## Kısaca

| # | İş | Kim | Süre | Maliyet |
|---|---|---|---|---|
| 1 | Alan adı al (studyom.app veya .com) | Sen | 1 saat | ~15 $/yıl |
| 2 | Canlı için ayrı Supabase projesi (Frankfurt) | Sen + ben | 1 saat | 0 $ (beta), sonra 25 $/ay |
| 3 | Hosting (Vercel) ve alan adı bağlantısı | Sen + ben | 1–2 saat | 0 $ (beta), para almaya başlayınca 20 $/ay |
| 4 | Ortam değişkenleri ve yeni `PORTAL_SECRET` | Ben | 15 dk | — |
| 5 | Supabase Auth: site adresi, SMTP, şablonlar | Sen | 30 dk | — |
| 6 | KVKK: veri sorumlusu bilgileri, yurt dışı aktarım sözleşmeleri | Sen (+ avukat) | 1–2 hafta | avukat ücreti |
| 7 | İzleme: hata takibi, çalışma kontrolü, yedek | Ben | yarım gün | 0 $ |
| 8 | Son kontrol ve ilk 3 eğitmenle kapalı deneme | Birlikte | 1 hafta | — |

---

## 1. Alan adı

- **Öneri:** `studyom.app`. Kısa, `.app` her zaman HTTPS ister (güven verir), yıllık ~15 $. Alternatif `studyom.com` (alınmış olabilir) veya `studyom.com.tr` (TRABIS üzerinden, kimlikle alınabiliyor).
- Aldıktan sonra kodda tek satır değişir: `src/lib/config.ts` → `APP_DOMAIN`.
- Alan adı alınınca e-posta için **Resend** (ayda 3.000, günde 100 ücretsiz) veya **Brevo** (günde 300 ücretsiz) açılabilir; gönderen `giris@studyom.app` gibi görünür, spam'e daha az düşer. Beta başlangıcında Gmail yeterli (günde 500 alıcı sınırı var).

## 2. Veritabanı (Supabase)

- **Geliştirme ile canlıyı ayır.** Şu anki projede test verileri var. Canlı için Frankfurt bölgesinde **yeni bir Supabase projesi** aç.
- Yeni projede migration'ları çalıştır: `DATABASE_URL` canlı projeyi gösterirken `pnpm db:migrate`. Storage bucket'ı ve politikaları da migration'la kuruluyor.
- **Plan:**
  - Free plan 7 gün hareketsiz kalınca projeyi uyutur ve **günlük yedek almaz**.
  - Gerçek eğitmenler günlük kullanınca uyuma sorun olmaz, ama sağlık bilgisi dahil danışan verisi tuttuğumuz için yedeksiz kalmak risk.
  - **Öneri:** İlk 5–10 eğitmen gelince Pro plana geç (25 $/ay, günlük yedek ve daha yüksek limitler).
- Bağlantı adresi: uygulama havuz (pooler, 6543 portu) adresini kullanıyor; `DATABASE_URL_DIRECT` (5432) sadece migration için.

## 3. Hosting (Vercel)

- **Öneri:** Vercel. Next.js'in kendi platformu, kurulum en kolay.
- **Dikkat:**
  - Vercel'in ücretsiz **Hobby planı ticari kullanıma kapalı.**
  - Ücretsiz beta bu dönemde tolere edilebilir; **para almaya başlamadan önce Pro'ya geç** (20 $/ay).
  - Alternatif: Cloudflare Workers ücretsiz planı ticari kullanıma açık, ama kurulumu daha zahmetli.
- **Bölge:** Fonksiyonları Frankfurt'a (`fra1`) ayarla. Veritabanıyla aynı bölgede olunca sayfalar hızlı açılır.
- **Alan adı:** Vercel'e ekle, DNS kayıtlarını alan adı sağlayıcında gir.

## 4. Ortam değişkenleri (Vercel → Settings → Environment Variables)

| Değişken | Canlıda değer | Not |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yeni projenin adresi | |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yeni projenin publishable anahtarı | |
| `DATABASE_URL` | yeni projenin pooler adresi (6543) | |
| `DATABASE_URL_DIRECT` | 5432 adresi | sadece migration |
| `NEXT_PUBLIC_SITE_URL` | `https://studyom.app` | canonical, OG ve danışan linkleri bununla oluşur |
| `PORTAL_SECRET` | **yeni, rastgele, uzun** bir değer | Geliştirmedekiyle aynı olmasın. Sonradan değiştirilirse danışanlara gönderilmiş bütün linkler bozulur |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` | Gmail (şimdilik) | `MAIL_FROM="Stüdyom <adres@gmail.com>"` |

## 5. Supabase Auth ayarları (canlı projede)

- **URL Configuration:** Site URL = `https://studyom.app`; Redirect URLs'e `https://studyom.app/**` ekle.
- **SMTP:** Custom SMTP'yi aç (Gmail + uygulama şifresi). Supabase'in kendi e-postası saatte birkaç e-postayla sınırlı, canlıda yetmez.
- **Şablonlar:** `supabase/templates/` içindeki dört şablonu yapıştır (README'de tablo var).
- **Email OTP Expiration:** 3600 saniye.
- **Rate limits:** "Emails sent per hour" değerini Gmail sınırına göre ayarla (örneğin saatte 30).

## 6. KVKK ve hukuki

1. **Veri sorumlusu bilgilerini doldur:** `src/lib/legal.ts` → ad soyad (şirket yoksa gerçek kişi), tebligat adresi, iletişim e-postası. Sonra `READY: true` yap; sayfalardaki "Taslak" uyarısı kalkar.
2. **Yurt dışına aktarım (en önemli madde):**
   - Supabase (AB'de sunucu, ABD şirketi), Google (Gmail) ve **Vercel** (ABD) kişisel veri işliyor.
   - 1 Eylül 2024'ten beri sürekli aktarım açık rızayla yapılamıyor. Her biriyle Kurul'un yayımladığı **standart sözleşme** imzalanmalı ve imzadan sonra **5 iş günü içinde Kurum'a bildirilmeli**.
   - Vercel'i de `SUBPROCESSORS` listesine eklemek gerekiyor; canlıya çıkarken ben eklerim.
   - Alternatif: verileri Türkiye'de barındırmak.
3. **VERBİS:** Küçük işletmeler genelde muaf, ama sağlık verisi işlendiği için muafiyet bir avukata sorulmalı.
4. **Avukat incelemesi:** Aydınlatma, açık rıza ve kullanım koşulları metinlerine kısa bir inceleme.
5. **Para almaya başlarken (şimdi değil):** Şahıs şirketi, e-arşiv fatura, mesafeli satış sözleşmesi ve iptal/iade metni. Genç girişimci muafiyeti için mali müşavire danış.

## 7. İzleme, güvenlik ve yedek

- **Hata takibi:** Sentry ücretsiz planı. Bir eğitmenin karşılaştığı hatayı o yazmadan görürüz.
- **Çalışma kontrolü:** UptimeRobot veya Better Stack ücretsiz planı, 5 dakikada bir ana sayfa ve giriş sayfası.
- **Yedek:**
  - Pro plana kadar haftada bir `pg_dump` yedeği (bunu bir komutla kurabilirim).
  - Pro'da günlük yedek otomatik.
- **Güvenlik başlıkları:** Yanıtlara standart güvenlik başlıklarını eklerim (tıklama hırsızlığı koruması, referrer politikası vb.), yarım saatlik iş.
- **Analitik:** Çerezsiz bir çözüm (Vercel Analytics veya Plausible) seçilirse çerez onayı gerekmez; KVKK metnine bir satır eklenir.
- **Bilinen teknik borç:** Tekrarlayan ders serisi silinirse (şu an arayüzde yok) veritabanı bağlantısında bir sorun çıkabilir. Seri silme eklenmeden önce düzeltilecek.

## 8. Son kontrol ve kapalı deneme

- [ ] Canlı adreste: kayıt ol → giriş kodu gelir → başlangıç → paket oluştur → danışan ekle → ders → yoklama → ödeme
- [ ] Trainer sayfası `/<slug>` → kayıt formu → başvuru e-postası → onay → danışan portalı
- [ ] Portal: randevu al, grup dersine katıl, havale bildir, dekont yükle, yeni paket iste
- [ ] Hesap silme (test hesabıyla)
- [ ] Telefon (iOS Safari + Android Chrome), açık ve koyu tema
- [ ] Google Search Console'a site ve `sitemap.xml` ekle
- [ ] Stüdyom Instagram hesabı ve destek e-posta adresi hazır
- [ ] İlk 3 eğitmenle 1 haftalık kapalı deneme; geri bildirimle düzelt, sonra açık beta

## Tahmini aylık maliyet

| Dönem | Supabase | Vercel | E-posta | Alan adı | Toplam |
|---|---|---|---|---|---|
| Kapalı beta (0–10 eğitmen) | 0 $ | 0 $ | 0 $ (Gmail) | ~1 $ | **~1 $** |
| Açık beta (10–100 eğitmen) | 25 $ | 0–20 $ | 0 $ (Resend free) | ~1 $ | **~26–46 $** |
| Ücretli dönem | 25 $+ | 20 $ | 0–20 $ | ~1 $ | **~46–66 $** |
