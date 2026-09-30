# Teknik SEO Bulguları: studyomapp.com (30.09.2026)

**Teknik skor: 72/100**

| Kategori | Durum |
|---|---|
| Taranabilirlik (robots, sitemap) | Kısmen geçti (sitemap'te 404 URL var) |
| İndekslenebilirlik (canonical, title, description) | Geçti (küçük notlar var) |
| Güvenlik başlıkları | **Kaldı** (kodda tanımlı, canlıda yok) |
| URL yapısı / yönlendirme | Geçti |
| Mobil | Geçti (viewport doğru) |
| JS render | Geçti (SSR/prerender, SPA değil) |
| Yapılandırılmış veri | Geçti (2 JSON-LD bloğu) |
| IndexNow | Yok (isteğe bağlı) |

## Critical

Yok.

## High

### H1. Güvenlik başlıkları canlı sitede yok
- **Kanıt:** `curl -sI https://studyomapp.com/` çıktısında Strict-Transport-Security, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, COOP ve Permissions-Policy yok. `x-powered-by: Next.js` hâlâ dönüyor. CSP olarak yalnızca Hostinger'ın `upgrade-insecure-requests` değeri görünüyor. `next.config.ts` satır 10-18 bunların hepsini tanımlıyor ve `poweredByHeader: false` (satır 22) diyor.
- **Neden:** Kod doğru ama canlı yayın ya eski commit'ten (20167f9 öncesi) ya da Hostinger CDN'i başlıkları siliyor. Ayrıca `x-nextjs-prerender: 1`, `x-nextjs-cache: HIT` ve `cache-control: s-maxage=31536000` ile statik sayfa önbellekten geliyor. Eski HTML/başlıklar yıllık önbellekte kalmış olabilir.
- **Düzeltme:** 1) Son commit'i deploy edin. 2) Hostinger/hcdn önbelleğini temizleyin. 3) `curl -sI` ile doğrulayın. 4) Başlıklar hâlâ yoksa hPanel'de (veya `.htaccess`/CDN ayarında) başlıkları orada ekleyin. Başlıklar statik sayfalarda da gelsin diye `next.config.ts` `headers()` zaten `/:path*` kaynağını kullanıyor; sorun orada değil.

### H2. Sitemap yayında olmayan bir URL listeliyor: `/testpilates` (404)
- **Kanıt:** `sitemap.xml` içinde `https://studyomapp.com/testpilates` (lastmod 2026-09-30T09:00) var. `curl` sonucu hem `/testpilates` hem `/testpilates/kayit` için 404. Brief'e göre yayınlanmış eğitmen sayfası yok.
- **Neden:** `src/app/sitemap.ts:12-16` `publicPageEnabled = true` olan kayıtları alıyor ve `revalidate = 3600` (satır 8). Test hesabı kısa süre yayında kalıp kapatıldıysa, sitemap en fazla 1 saat eski kalır. Ya da `publicPageEnabled` açık ama `[slug]/page.tsx` başka bir koşulla `notFound()` dönüyor.
- **Düzeltme:** `src/app/[slug]/page.tsx` içindeki `notFound()` koşulunu sitemap sorgusuyla aynı yapın (aynı yayın koşulu). Test hesabını kapatın veya silin. Sitemap'i yeniden doğrulayın. Google Search Console'da "Gönderilen URL 404 döndürüyor" uyarısı almamak için önemli.

## Medium

### M1. `/giris` hem robots.txt'te engelli hem de sitemap dışı, ama sayfada robots meta yok
- **Kanıt:** `robots.txt` `Disallow: /giris`. Sayfa 200 dönüyor, `<meta name="robots">` yok, canonical yok. title "Giriş · Stüdyom", description ana sayfanın aynısı.
- **Risk:** Engelli URL, dışarıdan link alırsa içeriksiz "URL var ama taranamadı" olarak indekslenebilir. Brief'te `/giris` "public" diye geçiyor; bilinçli kararsa sorun yok.
- **Düzeltme:** İki seçenekten biri. (a) Giriş sayfasını indekslenmesin istiyorsanız `Disallow: /giris` satırını `src/app/robots.ts:12` içinden kaldırıp `giris/page.tsx` metadata'sına `robots: { index: false, follow: true }` ekleyin (robots.txt engelliyse Google noindex'i göremez). (b) Aramada çıkmasını istiyorsanız robots'tan çıkarıp canonical ve benzersiz description ekleyin.

### M2. `/*/kayit` ve `/p/` kuralları
- **Kanıt:** `Disallow: /*/kayit` joker karakter kullanıyor. Google ve Bing destekler, ama bazı küçük botlar desteklemez. `/p/` yalnızca `/p/...` yollarını kapsar.
- **Risk:** Düşük; ancak eğitmen sayfası `/<slug>` indekslenecek, kayıt formu indekslenmeyecek, bu tasarım doğru.
- **Düzeltme:** Gerekli değil. İsterseniz `kayit/page.tsx` metadata'sına `robots: { index: false }` ile savunma katmanı ekleyin (robots.txt engelli olduğundan etkisi sınırlı).

### M3. HTTP ve www davranışı
- **Kanıt:** `http://studyomapp.com` -> 301 -> `https://studyomapp.com/` (doğru). `https://www.studyomapp.com` 200 döndürüyor, yönlendirme yok.
- **Risk:** www ve apex aynı içeriği sunuyor. Canonical apex'e işaret ettiği için zarar sınırlı, ama bağlantı değerini böler.
- **Düzeltme:** Hostinger'da `www` -> apex 301 yönlendirmesi ekleyin (hPanel, Domains, Redirects).

### M4. Canonical ve sitemap'te kök URL sonunda `/` yok
- **Kanıt:** `<link rel="canonical" href="https://studyomapp.com"/>`, `og:url` ve sitemap `<loc>https://studyomapp.com</loc>`. `src/app/page.tsx:38` `canonical: "/"` kullanıyor.
- **Risk:** Teknik olarak eşdeğer (kök yol her zaman `/`), sorun yok. Sadece not.
- **Düzeltme:** Gerekli değil.

## Low

### L1. `meta keywords` kullanılıyor
- `layout.tsx` (metadata) içinde `keywords` var. Google ve Bing yok sayar, rakiplere strateji sızdırır. Kaldırılabilir.

### L2. Sitemap `changefreq` ve `priority`
- Google yok sayar. `lastModified` eksik (kök ve yasal sayfalar). Gerçek `lastModified` eklemek faydalıdır: `sitemap.ts:16-17`.

### L3. 404 davranışı (olumlu, not)
- Olmayan URL gerçek 404 dönüyor ve `noindex` meta içeriyor, cache-control `no-store`. Doğru. Soft-404 yok.

### L4. IndexNow uygulanmamış
- `/indexnow.txt` ve anahtar dosyası yok (404). Google IndexNow'u kullanmıyor; Bing, Yandex, Naver için eğitmen sayfaları yayınlandığında URL bildirimi yararlı olur. Şimdilik (tek sayfa ağırlıklı site) öncelik düşük. Yapılacaksa: `public/<key>.txt` ekleyin ve sayfa yayın/güncelleme olduğunda `https://api.indexnow.org/indexnow` adresine POST atın.

### L5. `llms.txt` yok
- 404. Zorunlu değil; AI tarayıcı yönetimi için robots.txt'te ayrı kural yok (hepsi `*` ile izinli). Bilinçli karar ise sorun yok.

### L6. `hreflang`
- Tek dilli site (`<html lang="tr">`, `og:locale tr_TR`). hreflang gerekmiyor. Doğru.

## Geçen kontroller

- robots.txt 200, sitemap beyanı var, `sitemap_discovery.py` ile `sitemap.xml` geçerli (`urlset`).
- Ana sayfa ve yasal sayfalarda title, description, self-canonical benzersiz ve doğru. `/kvkk/` -> 308 -> `/kvkk` (sondaki eğik çizgi normalize ediliyor).
- Viewport: `width=device-width, initial-scale=1, viewport-fit=cover`. Zoom engeli yok. `theme-color` açık/koyu tanımlı.
- Ana sayfa 172 KB HTML, brotli sıkıştırma açık, tek `h1`, `h2` hiyerarşisi düzgün; içerik sunucu tarafında render ediliyor (16 script ama SPA kabuğu değil).
- OG/Twitter: 1200x630 PNG, mutlak URL, `og:locale tr_TR`. `manifest.webmanifest` 200, apple-touch-icon var.
- Yapılandırılmış veri: 2 JSON-LD bloğu (SoftwareApplication, FAQPage).
- Sayfada `<img>` yok; CLS/LCP riski düşük. LCP adayı metin (h1), font (Poppins) için `next/font` kullanılıyor.
- Core Web Vitals: kaynak incelemesine göre belirgin risk yok; gerçek ölçüm için PageSpeed Insights / CrUX verisi gerekir (yeni site, veri henüz olmayabilir).

## Öncelik sırası

1. H1: güncel sürümü deploy edin, CDN önbelleğini temizleyin, başlıkları doğrulayın.
2. H2: `/testpilates` sitemap/404 tutarsızlığını giderin.
3. M3: www -> apex yönlendirmesi.
4. M1: `/giris` için karar verin (noindex mi, indekslensin mi).
5. L-maddeleri isteğe bağlı.
