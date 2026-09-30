# Canlıya Çıkış Listesi

> Stüdyom'u ilk gerçek eğitmenlere açmadan önce yapılacaklar. Sıra önemli: üstteki adımlar alttakilerin ön koşulu.
> Hukuki maddeler bilgi amaçlıdır; KVKK avukatı ve mali müşavir görüşünün yerini tutmaz.

## Kısaca

| # | İş | Kim | Süre | Maliyet |
|---|---|---|---|---|
| 1 | Alan adı seç (Hostinger planında 1 yıl ücretsiz) | Sen | 1 saat | 0 TL ilk yıl |
| 2 | Canlı için ayrı Supabase projesi (Frankfurt) | Sen + ben | 1 saat | 0 $ (beta), sonra 25 $/ay |
| 3 | Hosting (Hostinger Node.js planı) ve alan adı | Sen + ben | 1–2 saat | 2.160 TL ilk yıl, sonra 500 TL/ay |
| 4 | Ortam değişkenleri ve yeni `PORTAL_SECRET` | Ben | 15 dk | — |
| 5 | Supabase Auth: site adresi, SMTP, şablonlar | Sen | 30 dk | — |
| 6 | KVKK: veri sorumlusu bilgileri, yurt dışı aktarım sözleşmeleri | Sen (+ avukat) | 1–2 hafta | avukat ücreti |
| 7 | İzleme: hata takibi, çalışma kontrolü, yedek | Ben | yarım gün | 0 $ |
| 8 | Son kontrol ve ilk 3 eğitmenle kapalı deneme | Birlikte | 1 hafta | — |

---

## 1. Alan adı

- **Alındı:** `studyomapp.com` (Hostinger, ilk yıl ücretsiz). `studyom.com` ve `studyom.net` başkasında; `studyom.com.tr` boş görünüyordu, ileride yönlendirme için alınabilir.
- Kodda: `src/lib/config.ts` → `APP_DOMAIN`.
- Alan adı alınınca e-posta için **Resend** (ayda 3.000, günde 100 ücretsiz) veya **Brevo** (günde 300 ücretsiz) açılabilir; gönderen `giris@studyomapp.com` gibi görünür, spam'e daha az düşer. Beta başlangıcında Gmail yeterli (günde 500 alıcı sınırı var).

## 2. Veritabanı (Supabase)

- **Geliştirme ile canlıyı ayır.** Şu anki projede test verileri var. Canlı için Frankfurt bölgesinde **yeni bir Supabase projesi** aç.
- Yeni projede migration'ları çalıştır: `DATABASE_URL` canlı projeyi gösterirken `pnpm db:migrate`. Storage bucket'ı ve politikaları da migration'la kuruluyor.
- **Plan:**
  - Free plan 7 gün hareketsiz kalınca projeyi uyutur ve **günlük yedek almaz**.
  - Gerçek eğitmenler günlük kullanınca uyuma sorun olmaz, ama sağlık bilgisi dahil danışan verisi tuttuğumuz için yedeksiz kalmak risk.
  - **Öneri:** İlk 5–10 eğitmen gelince Pro plana geç (25 $/ay, günlük yedek ve daha yüksek limitler).
- Bağlantı adresi: uygulama havuz (pooler, 6543 portu) adresini kullanıyor; `DATABASE_URL_DIRECT` (5432) sadece migration için.

## 3. Hosting

**Karar: Hostinger (Node.js destekli plan), yedek seçenek Vercel.**

- **Plan:** İlk 12 ay 2.159,88 TL peşin (ayda 179,99 TL), yenileme 499,99 TL/ay. 1 yıl ücretsiz domain ve kurumsal e-posta dahil. Ticari kullanım serbest.
- **Next.js 16 ile uyum:** [Hostinger dokümanına](https://docs.hostinger.com/node.js/overview-1/next.md) göre sunucu modu, Server Actions, middleware (bizde `proxy.ts`), ISR ve görsel optimizasyonu destekleniyor. Node 18/20/22/24 seçilebiliyor; pnpm destekleniyor; ortam değişkenleri hem build'de hem çalışırken geçerli.
- **Standalone çıktı:** Hostinger build'den önce otomatik olarak `output: "standalone"` ekliyor. Bu mod yerelde denendi: build başarılı (~50 MB), ana sayfa, giriş, KVKK, robots, sitemap, paylaşım görseli ve danışan portalı gerçek veritabanıyla çalıştı.
- **Kurulum ayarları (hPanel → Node.js uygulaması):**
  - Kaynak: GitHub deposu (her push'ta otomatik yayın).
  - Framework: Next.js; paket yöneticisi pnpm.
  - Node: 22. `package.json` → `engines.node >= 22`; Supabase kütüphanesi Node 20'yi artık önermiyor.
  - Build komutu `pnpm run build`, çıktı dizini `.next`.
  - `build` betiği `next build --webpack` çalıştırır: Turbopack CSS için ayrı bir Node işlemi başlatıyor, Hostinger'ın paylaşımlı ortamı buna izin vermiyor (derleme `globals.css` hatasıyla düşüyordu). Yerelde `pnpm dev` Turbopack'le çalışmaya devam eder.
  - pnpm 10 kullanılır (`packageManager`); Hostinger pnpm 12'yi indiremiyor.
  - Veri merkezi: **Avrupa** (Almanya ya da Hollanda). Veritabanı Frankfurt'ta.
- **Sınırlar:** Kurulum ve build için ayrı ayrı 15 dakika süre sınırı var (bizim build 1–2 dakika). RAM ve CPU plana bağlı; build bellek yetmezse bir üst plana geçilir.
- **Dikkat:** `next.config.ts` bir nesne olarak dışa aktarılmalı (öyle); fonksiyon biçimli config Hostinger'da sessizce yok sayılıyor.
- **Yedek plan:** Sorun çıkarsa 30 günlük iade süresi içinde Vercel'e geç. Kodda platforma özel bir şey yok.

## 4. Ortam değişkenleri (Hostinger hPanel → Environment variables)

| Değişken | Canlıda değer | Not |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yeni projenin adresi | |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yeni projenin publishable anahtarı | |
| `DATABASE_URL` | yeni projenin pooler adresi (6543) | |
| `DATABASE_URL_DIRECT` | 5432 adresi | sadece migration |
| `NEXT_PUBLIC_SITE_URL` | `https://studyomapp.com` | canonical, OG ve danışan linkleri bununla oluşur |
| `PORTAL_SECRET` | **yeni, rastgele, uzun** bir değer | Geliştirmedekiyle aynı olmasın. Sonradan değiştirilirse danışanlara gönderilmiş bütün linkler bozulur |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` | Gmail (şimdilik) | `MAIL_FROM="Stüdyom <adres@gmail.com>"` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | **canlı için yeni** anahtar çifti | Bildirimler için. `npx web-push generate-vapid-keys` ile üretilir; `VAPID_SUBJECT=mailto:destek@alanadi`. Sonradan değişirse herkesin bildirim aboneliği düşer, yeniden açmaları gerekir |
| `CRON_SECRET` | uzun, rastgele bir değer | Zamanlanmış görevleri (aşağıda) korur |

### Zamanlanmış görev (cron)

Ders hatırlatması ("Geliyor musun?"), paket yenileme teklifi, pazartesi haftalık özeti ve grup derslerinin önceden oluşturulması `/api/cron` adresinden çalışır. hPanel → **Gelişmiş → Cron Jobs** bölümünde **15 dakikada bir** şu komut eklenir:

```
curl -fsS -H "Authorization: Bearer CRON_SECRET_DEĞERİ" https://studyomapp.com/api/cron
```

Her görev bir kez işaretlendiği için kaçan ya da iki kez çalışan tetikleme sorun yaratmaz. Hostinger cron'u yoksa ücretsiz cron-job.org aynı işi görür.

## 5. Supabase Auth ayarları (canlı projede)

- **URL Configuration:** Site URL = `https://studyomapp.com`; Redirect URLs'e `https://studyomapp.com/**` ekle.
- **SMTP:** Custom SMTP'yi aç (Gmail + uygulama şifresi). Supabase'in kendi e-postası saatte birkaç e-postayla sınırlı, canlıda yetmez.
- **Şablonlar:** `supabase/templates/` içindeki dört şablonu yapıştır (README'de tablo var).
- **Email OTP Expiration:** 3600 saniye.
- **Rate limits:** "Emails sent per hour" değerini Gmail sınırına göre ayarla (örneğin saatte 30).

## 6. KVKK ve hukuki

1. **Veri sorumlusu bilgilerini doldur:** `src/lib/legal.ts` → ad soyad (şirket yoksa gerçek kişi), tebligat adresi, iletişim e-postası. Sonra `READY: true` yap; sayfalardaki "Taslak" uyarısı kalkar.
2. **Yurt dışına aktarım (en önemli madde):**
   - Supabase (AB'de sunucu, ABD şirketi), Google (Gmail) ve **Hostinger** (Litvanya merkezli, sunucu Avrupa'da) kişisel veri işliyor.
   - 1 Eylül 2024'ten beri sürekli aktarım açık rızayla yapılamıyor. Her biriyle Kurul'un yayımladığı **standart sözleşme** imzalanmalı ve imzadan sonra **5 iş günü içinde Kurum'a bildirilmeli**.
   - Hostinger'ı da `SUBPROCESSORS` listesine eklemek gerekiyor; canlıya çıkarken ben eklerim. Kurumsal e-postaya geçilince Gmail listeden çıkar.
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
- **Güvenlik başlıkları:** Yapıldı (`next.config.ts`): HSTS, tıklama hırsızlığına karşı çerçeve yasağı, `nosniff`, referrer politikası, kamera/mikrofon/konum izinleri kapalı, form hedefi ve `<base>` kısıtı. Script kısıtlayan tam CSP yok; her istekte nonce ve tamamen dinamik sayfa gerektiriyor.
- **Analitik:** Çerezsiz bir çözüm (Vercel Analytics veya Plausible) seçilirse çerez onayı gerekmez; KVKK metnine bir satır eklenir.
- **Bilinen teknik borç:** Tekrarlayan ders serisi silinirse (şu an arayüzde yok) veritabanı bağlantısında bir sorun çıkabilir. Seri silme eklenmeden önce düzeltilecek.

## 8. Son kontrol ve kapalı deneme

- [ ] Canlı adreste: kayıt ol → giriş kodu gelir → başlangıç → paket oluştur → danışan ekle → ders → yoklama → ödeme
- [ ] Trainer sayfası `/<slug>` → kayıt formu → başvuru e-postası → onay → danışan portalı
- [ ] Portal: randevu al, grup dersine katıl, havale bildir, dekont yükle, yeni paket iste, "Geliyorum" onayı, mesaj yaz
- [ ] Bildirimler: Android Chrome'da ve iPhone'da (ana ekrana ekledikten sonra) eğitmen ve danışan tarafında bildirimi aç, bir mesajla dene
- [ ] Cron: `/api/cron` yanıtı `{"ok":true,...}`; ertesi güne ders koyup hatırlatmanın geldiğini gör
- [ ] Excel'den danışan aktar (örnek dosyayla) ve verileri dışa aktar
- [ ] Hesap silme (test hesabıyla)
- [ ] Telefon (iOS Safari + Android Chrome), açık ve koyu tema
- [ ] Google Search Console'a site ve `sitemap.xml` ekle
- [ ] Stüdyom Instagram hesabı ve destek e-posta adresi hazır
- [ ] İlk 3 eğitmenle 1 haftalık kapalı deneme; geri bildirimle düzelt, sonra açık beta

## Tahmini aylık maliyet

| Dönem | Supabase | Hosting | E-posta | Alan adı | Toplam (aylık) |
|---|---|---|---|---|---|
| Kapalı beta (0–10 eğitmen) | 0 $ | 180 TL (Hostinger, domain ve e-posta dahil) | dahil | dahil | **~180 TL** |
| Açık beta (10–100 eğitmen) | 25 $ | 180 TL | dahil | dahil | **~1.250 TL** |
| 2. yıl ve ücretli dönem | 25 $+ | 500 TL | dahil ya da Resend | ~500 TL/yıl | **~1.600 TL+** |
