# studyomapp.com · SEO eylem planı

> 30 Eylül 2026 denetimi. Ayrıntılar `findings/` altında: `technical.md`, `content.md`, `schema.md`, `performance.md`, `geo.md`, `sxo.md`.

## Genel skor: 63 / 100

| Kategori | Ağırlık | Skor |
|---|---|---|
| Teknik SEO | %22 | 72 |
| İçerik kalitesi | %23 | 64 |
| Sayfa içi SEO | %20 | 60 |
| Yapılandırılmış veri | %10 | 62 |
| Performans | %10 | 62 (tahmin; PageSpeed kotası dolu olduğu için ölçülemedi) |
| Yapay zekâ aramaları | %10 | 52 |
| Görseller | %5 | 60 |

Ayrı bir ölçü olarak arama deneyimi (SXO) skoru 53 / 100.

**Özet:** Teknik temel sağlam: sunucuda oluşturulan sayfalar, doğru canonical, `lang="tr"`, gerçek 404, geçerli robots ve sitemap. Puanı düşürenler:
- Tek, genel bir landing sayfası var; aranan ifadeler metinde geçmiyor.
- Markayı tanımlayan bilgi (Organization) eksik.
- Ürünün arkasındaki kişi görünmüyor, dışarıdan bahseden de yok.

Anahtar kelime notu: "danışan takip programı" diyetisyen ve klinik yazılımlarının, "spor salonu üye takip programı" turnike sistemlerinin alanı. Bunları tek başına hedeflemeyin, başına mutlaka "pilates" ya da "PT" ekleyin.

## 1. Aşama · Hemen (bu hafta)

| # | Önem | İş | Kim |
|---|---|---|---|
| 1 | Kritik | Hostinger CDN'in "Checking your browser" doğrulama sayfası bot gibi görünen isteklere 403 döndürüyor. Search Console → URL denetimi → **Canlı URL'yi test et** ile Googlebot'un sayfayı gördüğünü doğrula. Göremiyorsa hPanel'de bot koruma ayarını gevşet. | Sen |
| 2 | Yüksek | Organization + WebSite yapılandırılmış verisi (`@graph`), kare logo PNG, SoftwareApplication düzeltmeleri (`operatingSystem: Web`, offers url/availability) | Ben |
| 3 | Yüksek | `www.studyomapp.com` → `studyomapp.com` kalıcı yönlendirme (301) | Ben |
| 4 | Yüksek | Ana başlık ve özellikler başlığında aranan ifade ("pilates", "personal trainer", "seans paketi takibi"); 40–60 kelimelik "Stüdyom nedir?" tanımı | Ben (metin onayın) |
| 5 | Yüksek | SSS'ye yeni sorular: çok eğitmenli stüdyo, beta sonrası fiyat, veriler nerede ve nasıl silinir, 24 saat iptal ve telafi kuralı | Ben (kararların) |
| 6 | Orta | Kurucu ve iletişim: landing alt kısmına e-posta, kısa "Hakkında" bölümü | Ben |
| 7 | Orta | Metindeki çelişki ("kurulum gerekmez" ile "akşam kurun"), çeviri kokan istatistikler, "tek dokunuşla" tekrarı | Ben |
| 8 | Orta | Sitemap'e `lastModified`, giriş sayfasına `noindex`, `llms.txt`, `security.txt` | Ben |
| 9 | Orta | Performans: Sentry paket küçültme, font ağırlıklarını azaltma, Umami'yi geç yükleme | Ben |
| 10 | Orta | Yeni pazarlama sayfaları için adres çakışmasını önlemek: `src/lib/slug.ts` RESERVED listesine pilates-egitmenleri, personal-trainer, online-randevu, karsilastirma, sablonlar, rehber, blog, ozellikler, alternatif, pilates | Ben |

## 2. Aşama · 2–3 hafta

- **Kitleye özel sayfalar:**
  - `/pilates-egitmenleri`: "pilates eğitmeni danışan takip programı"
  - `/personal-trainer`: "personal trainer uygulaması"
- **`/fiyatlar`:** Beta süresince ücretsiz olduğunu ve beta sonrası için verilen sözü yaz. Sözün ne olacağını sen karar ver.
- **Tanıtım:** Gerçek ekran görüntüleri (alt metinli) ve 60–90 saniyelik tanıtım videosu.
- **Bing Webmaster Tools'a ekleme.** ChatGPT ve Copilot Bing'in dizinini kullanıyor. IndexNow da buradan kurulur.

## 3. Aşama · 2. ay

- **Karşılaştırma sayfaları:** `/karsilastirma` ve alternatif sayfaları. Tarih verilmiş kaynaklar kullan, rakipler hakkında doğrulanmamış bilgi yazma.
- **Excel şablonu:** `/sablonlar/seans-paketi-takip-tablosu`. İçe aktarma biçimimizle aynı ücretsiz Excel dosyası.
- **Rehber yazıları:** iptal ve telafi kuralı, paket fiyatlandırma, KVKK sağlık formu.
- **Marka sinyalleri:** Instagram, LinkedIn, YouTube profilleri. Beta eğitmenlerinden izin alınmış gerçek alıntılar ve sayılar.

## 4. Aşama · Sürekli

- Search Console: dizine ekleme ve arama sorguları, haftada bir.
- PageSpeed Insights ile gerçek Core Web Vitals ölçümü (kota yenilenince).
- Her yeni eğitmen sayfası yayında kalıcı içerik sayılır; kalitesiz ya da boş sayfaları kapat.

## Senin kararın gereken konular

1. Birden fazla eğitmenli stüdyolara ne diyoruz? Önerim: "Şimdilik tek başına çalışan eğitmenler için."
2. Beta sonrası fiyat sözü: karar verildi. "Ücretli plana geçmeden en az bir hafta önce haber veririz; beta kullanıcılarına ilk abonelikte indirim."
3. Sosyal hesaplar: açılınca adreslerini ver, yapılandırılmış veriye (`sameAs`) eklenecek.
