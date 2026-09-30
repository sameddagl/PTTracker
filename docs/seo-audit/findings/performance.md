# Performans ve Core Web Vitals (studyomapp.com, 30 Eylul 2026)

Tahmini skor: **62 / 100** (lab verisi yok, olculen sunucu ve payload metriklerine dayali tahmin).

## Olcum sinirlari (dürüst not)
- PageSpeed Insights API: **429, gunluk kota dolu**. Yerelde Chrome/Lighthouse yok (`/Applications/Google Chrome.app` yok).
  Bu yuzden **LCP, INP, CLS, TBT sayisal olarak OLCULEMEDI**. Asagidaki degerler payload ve sunucu olcumlerinden cikarimdir.
- CrUX/saha verisi alinmadi (yeni alan adi, buyuk olasilikla yeterli trafik yok).
- Yeniden yapilmasi gereken: PSI'yi (mobil + masaustu, `/` ve `/giris`) kota yenilenince veya API anahtariyla calistirin.

## Olculenler
| Metrik | `/` | `/giris` |
|---|---|---|
| TTFB (curl, Turkiye cikisli, TLS dahil toplam ~0.15-0.40 s) | 0.15-0.39 s (HIT, edge) | ~0.39 s (DYNAMIC) |
| HTML boyutu (aktarilan, sikistirmasiz) | 171.836 bayt (gzip -9 ile ~26 KB) | 20.123 bayt |
| Cache-Control | `s-maxage=31536000` (x-nextjs-prerender, hcdn HIT) | `private, no-cache, no-store` (DYNAMIC) |
| HTTP | h2, alt-svc h3 | h2, h3 |

Ana sayfa JS (13 script, hepsi `async`): ham **~1,05 MB**, gzip tahmini **~330 KB**. Buyukler:
- `699-*.js` 420 KB ham (~130 KB gz) icinde Sentry + replay/tracing kodu var
- `3578-*.js` 250 KB (~73 KB gz)
- `4bd1b696-*.js` 201 KB (react-dom, ~63 KB gz)
- `polyfills-*.js` 112 KB (`noModule`, modern tarayicida indirilmez, sorun degil)
- CSS tek dosya 86 KB ham (~15 KB gz)
- Font: 10 adet woff2 `preload` (Poppins 4 agirlik x latin + latin-ext, Inconsolata)
- Statik dosyalar: `public, max-age=31536000, immutable` (dogru), ikinci istekte hcdn HIT.
- Ana sayfada `<img>` yok (39 inline SVG), 717 DOM elemani (1.500 altinda, iyi). Hero LCP ogesi metin (`h1`), gorsel gecikmesi yok.

## Bulgular

### 1. [YUKSEK] hcdn "Checking your browser" JS challenge / 403 (botlara ve olcum araclarina)
- Kanit: curl'de `Accept-Encoding` basligi gonderilince (ve bazen yalnizca UA ile) `/` ve `/giris` **HTTP 403**, 2.584 bayt br sikistirilmis "Just a moment... Checking your browser" sayfasi (`/hcdn-cgi/jschallenge`, 3 sn bekleme). Basliksiz istekler 200 doner. Davranis kararsiz.
- Risk: Googlebot, PSI, Lighthouse, sosyal onizleme botlari bu sayfayi gorurse indeks ve olcum bozulur; gercek kullanicida LCP'ye ~3 sn eklenebilir.
- Duzeltme: Hostinger hPanel > Guvenlik/WAF (Bot koruma, "Under attack"/challenge) modunu kapatin veya dusuk seviyeye alin; Googlebot ve PSI ile dogrulayin (Search Console "URL Inspection > Live test"). Dosya degil, panel ayari.

### 2. [YUKSEK] Ana sayfa HTML'i 172 KB, 99 KB'i inline script (RSC payload)
- Kanit: 3 inline script = 99.161 bayt; toplam HTML 171.836 bayt. Sikistirma dogrulanamadi (hcdn ayni boyutu sikistirmasiz verdi, asset'lerde `content-encoding` yok). Tarayici `Accept-Encoding` gonderdiginde durum farkli olabilir; 403 nedeniyle test edilemedi.
- Dosya: `src/app/page.tsx` (542 satir). Buyuk client bilesenleri/props RSC payload'ina seriyelesiyor.
- Duzeltme: Client bilesen sinirlarini kucultun, buyuk veri/metni server bileseninde tutun, `"use client"` yalnizca etkilesimli ada olarak birakin. Sikistirmayi tarayici benzeri bir istemciyle (Lighthouse/WebPageTest) dogrulayin; yoksa hPanel'de Brotli/gzip'i acin.

### 3. [ORTA] Sentry istemci SDK'si ana paketi sisiriyor (TBT/INP riski)
- Kanit: `699-*.js` 420 KB ham; icinde Sentry, replay ve tracing referanslari. `src/lib/sentry.ts` `tracesSampleRate: 0.05` -> `browserTracingIntegration` yukleniyor. `src/instrumentation-client.ts` `Sentry.init` ilk yuklemede senkron calisir.
- Duzeltme: (a) `tracesSampleRate`'i kaldirin/0 yapin (tracing kodunu atar); (b) `next.config.ts` `withSentryConfig` icinde `bundleSizeOptimizations: { excludeTracing: true, excludeReplayIframe: true, excludeReplayShadowDom: true, excludeReplayWorker: true }` (replay zaten kullanilmiyor); (c) gerekirse `Sentry.lazyLoadIntegration` veya init'i `requestIdleCallback` ile erteleyin. Beklenen: ~40-60 KB ham kazanc.

### 4. [ORTA] Font preload fazlasi (10 woff2)
- Kanit: `<link rel="preload" as="font">` x10 (Poppins 400/500/600/700 x latin + latin-ext, Inconsolata). Kritik yolda bant genisligi rekabeti, ozellikle mobilde LCP metin render gecikmesi.
- Dosya: `src/app/layout.tsx` (`Poppins({... weight: ["400","500","600","700"], subsets: ["latin","latin-ext"]})`, `Inconsolata`).
- Duzeltme: Agirliklari 400/600 ile sinirlayin, Inconsolata icin `preload: false` verin (yalniz IBAN/kod), `latin-ext` icin `preload: false` (Turkce karakterler `latin-ext` gerektirir, ama unicode-range ile gerektiginde inecek; preload zorunlu degil). Hero icin yalniz 600 latin preload kalsin.

### 5. [ORTA] Ucuncu taraf: Umami + Fonts.googleapis
- Kanit: `https://cloud.umami.is/script.js` (2,3 KB br, `max-age=86400`) `<link rel=preload as=script>` ile erken cekiliyor. Ayrica ham HTML'de yalnizca challenge sayfasinda `fonts.googleapis.com` (DM Sans) var, gercek sayfada yok.
- Dosya: `src/components/analytics.tsx` (`strategy="afterInteractive"`).
- Duzeltme: `strategy="lazyOnload"` yapin (INP/TBT'yi etkilemez, sayim kaybi ihmal edilebilir). Umami kucuk, risk dusuk.

### 6. [DUSUK] `/giris` onbellekte degil (DYNAMIC, no-store)
- Kanit: `x-hcdn-cache-status: DYNAMIC`, TTFB ~0.39 s; 20 KB HTML, 13 script.
- Dosya: `src/app/giris/page.tsx`. `cookies()`/`headers()` kullaniliyorsa statik kabugu ayirin (Suspense ile dinamik parca), boylece hcdn HIT olur.

### 7. [DUSUK] HTML `cache-control` yalnizca `s-maxage`
- Kanit: `cache-control: s-maxage=31536000`, `x-nextjs-stale-time: 300`. Tarayici her seferinde kosullu istek yapar (ETag var, sorun degil). Yayin sonrasi CDN purge gerektigine dikkat (1 yillik s-maxage; deploy sonrasi eski HTML kalabilir, asset hash'leri degisince 404 riski).
- Duzeltme: Deploy sonrasi hcdn cache temizleyin veya `s-maxage`'i 3600-86400'e dusurun (`next.config.ts` headers).

### 8. [BILGI] Guvenlik basliklari CDN'de eziliyor
- `content-security-policy: upgrade-insecure-requests` ve challenge yanitinda `frame-ancestors *`, hcdn'nin eklemesi; uygulamadaki `frame-ancestors 'none'` CSP'si ana sayfada gorunmuyor. Performansla ilgisiz, guvenlik ajanina iletilsin.

## Iyi olanlar
- Statik varliklar `immutable` 1 yil, HTTP/2 + h3, HSTS.
- Tum script'ler `async`; polyfills `noModule`.
- LCP ogesi metin (resim yok) ve fontlar `next/font` ile self-host, `display: swap` varsayilan -> CLS dusuk beklenir (tahmin: <0,05).
- DOM 717 eleman.

## Beklenen CWV (tahmin, olculmedi)
- LCP mobil: 2,5-3,5 s (challenge yoksa ~2,2 s; 10 font + ~330 KB gz JS etkili).
- INP: iyi beklenir (<200 ms), TBT Sentry/React hydration nedeniyle mobilde 150-400 ms olabilir.
- CLS: ~0-0,05.

## Oncelik sirasi
1. Bot challenge'i kapat/gevset ve PSI'yi yeniden kos (bulgu 1).
2. Sentry bundle optimizasyonu (bulgu 3).
3. Font preload azalt (bulgu 4).
4. RSC payload kucult, sikistirmayi dogrula (bulgu 2).
5. Umami lazyOnload (bulgu 5).
