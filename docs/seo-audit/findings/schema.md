# Schema / Yapılandırılmış Veri Denetimi - studyomapp.com

Tarih: 2026-09-30 | Skor: **62/100**

## 1. Tespit
Anasayfada tek bir `application/ld+json` bloğu (2700 bayt, geçerli JSON), dizi olarak iki varlık: `SoftwareApplication` ve `FAQPage` (+ Question/Answer). Microdata/RDFa yok. Sunucu tarafında render ediliyor (raw HTML'de var). Kod: `src/app/page.tsx` (JSON_LD), `src/app/[slug]/page.tsx` (SportsActivityLocation).

## 2. Doğrulama

| Blok | Sonuç | Not |
|---|---|---|
| SoftwareApplication | Geçerli (schema.org), zengin sonuç için uygun değil | `@context` https, `offers.price "0"` + `TRY` doğru, `inLanguage "tr-TR"` geçerli. Google "Software app" zengin sonucu `aggregateRating` veya `review` şart koşar; ikisi de yok (ve eklenmemeli). Yani yalnızca varlık/anlam işaretlemesi olarak değer taşır. |
| FAQPage | Geçerli ama fayda yok (Bilgi) | Google FAQ zengin sonuçlarını 7 Mayıs 2026'da tüm siteler için kaldırdı. SERP etkisi yok; AI/GEO faydası doğrulanmamış. Kritik değil; zararsız, isterseniz kalsın (sayfada görünen SSS ile birebir aynı olmalı). Gerçek kullanıcı soru-cevapları için QAPage kullanılır, burada gerekmez. |
| SportsActivityLocation (eğitmen sayfaları) | Geçerli, iyileştirilebilir | Aşağıda. |

### SoftwareApplication eksik/zayıf noktalar
- `@id` yok; diğer varlıklar (Organization/WebSite) bağlanamıyor.
- `offers.availability`, `offers.url`, `priceValidUntil` yok (ücretsiz beta için `priceValidUntil` zorunlu değil; beta bitince fiyat değişecekse güncelleyin).
- `publisher`/`creator` yok, `image`/`screenshot` yok.
- `operatingSystem: "Web, iOS, Android"`: iOS/Android için mağaza uygulaması yoksa (PWA ise) yanıltıcı olabilir. Yalnızca "Web" (veya "Web (PWA)") daha doğru; `browserRequirements` eklenebilir.
- `applicationCategory`: "BusinessApplication" kabul edilebilir; "HealthApplication" da düşünülebilir ama iş aracı olduğu için mevcut seçim iyi.

### Eksik varlıklar
- **Organization: yok.** Yasal şirket yok (veri sorumlusu Abdulsamed Dağlı, info@studyomapp.com). `Organization` olarak markayı tanımlayın; `logo` (kare, min 112x112, mutlak URL), `url`, `email`, `sameAs` (varsa Instagram). Şirket kurulana kadar `legalName`, adres, vergi no eklemeyin.
- **WebSite: yok.** `name`, `url`, `inLanguage`. Sitelinks searchbox eklemeyin (sitede arama yok; Google bu özelliği zaten kaldırdı). `WebSite.name` = "Stüdyom", alternateName isteğe bağlı.
- **WebPage:** isteğe bağlı, `@graph` ile bağlamak faydalı.
- BreadcrumbList: anasayfada gereksiz.
- Review/AggregateRating: **eklemeyin** (yorum yok).

### Eğitmen sayfaları (SportsActivityLocation)
- Geçerli tip; `name`, `url`, `description`, `image`, `address`, `sameAs` iyi.
- `address.addressLocality` değeri `trainer.city` ham metni. Alan "Kadıköy, İstanbul" gibi virgüllü olabilir (kod `city.split(",")[0]` kullanıyor); ilçe/il ayrıştırılıp `addressLocality` (ilçe) + `addressRegion` (il) verilmeli, yoksa yalnızca tek değer.
- Açık adres olmadığında Google yerel işletme sonucu çıkmaz; beklenen durum. `telephone`, `openingHours`, `geo` yok; veri yoksa eklemeyin.
- `hasOfferCatalog.itemListElement`: `Offer` doğrudan içinde ama hizmet `itemOffered` ile tanımlanmalı (Offer.name yerine). Öneri: `{"@type":"Offer","itemOffered":{"@type":"Service","name":...},"price":...,"priceCurrency":"TRY"}`. Paket yoksa boş `itemListElement: []` üretilmesin (filtre sonrası boş dizi bloğu oluşabilir; boşsa `hasOfferCatalog`'ı tamamen atın).
- `inLanguage` eklenebilir (`tr`); `@id` = sayfa URL + `#place`.
- `priceRange` alanı kullanılacaksa gerçek aralık verin; yoksa atlayın.
- Not: `.replace(/</g,"\\u003c")` XSS kaçışı doğru, koruyun.

### Kontrol listesi
- `@context` https: geçti. Mutlak URL: geçti (`siteUrl()`; production'da `NEXT_PUBLIC_SITE_URL` ayarlı olmalı; canonical `https://studyomapp.com` görünüyor, iyi). Placeholder yok. Tarih alanı yok.
- `inLanguage`: `tr-TR` geçerli; `tr` de kabul edilir. Sayfa `lang="tr"` ile tutarlı.
- Yinelenen varlık yok, ancak dizi yerine tek `@graph` tercih edilir.

## 3. Öncelikli aksiyonlar
1. (Yüksek) Organization + WebSite ekleyin, `@graph` ve `@id` ile SoftwareApplication'a bağlayın.
2. (Orta) `operatingSystem` değerini gerçeğe uydurun; `offers`'a `availability` ve `url` ekleyin.
3. (Orta) Eğitmen sayfasında `itemOffered`, `addressRegion`, boş katalog kontrolü.
4. (Bilgi) FAQPage: SERP faydası yok; tutmak veya kaldırmak isteğe bağlı.
5. Yorum/puan işaretlemesi eklemeyin.

## 4. Yapıştırmaya hazır düzeltilmiş JSON-LD (anasayfa)

`public/` içine kare logo koyun (ör. 512x512 PNG; `src/app/icon.svg` Google için uygun değildir, raster/uygun boyutlu görsel gerekir). Kod tarafında `siteUrl()` ve `APP_NAME` kullanın; aşağıda üretim değerleri gösterilmiştir.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://studyomapp.com/#organization",
      "name": "Stüdyom",
      "url": "https://studyomapp.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://studyomapp.com/logo-512.png",
        "width": 512,
        "height": 512
      },
      "email": "info@studyomapp.com"
    },
    {
      "@type": "WebSite",
      "@id": "https://studyomapp.com/#website",
      "url": "https://studyomapp.com",
      "name": "Stüdyom",
      "inLanguage": "tr-TR",
      "publisher": { "@id": "https://studyomapp.com/#organization" }
    },
    {
      "@type": "WebPage",
      "@id": "https://studyomapp.com/#webpage",
      "url": "https://studyomapp.com",
      "name": "Stüdyom · Pilates ve PT için Danışan ve Seans Takibi",
      "inLanguage": "tr-TR",
      "isPartOf": { "@id": "https://studyomapp.com/#website" },
      "about": { "@id": "https://studyomapp.com/#software" }
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://studyomapp.com/#software",
      "name": "Stüdyom",
      "url": "https://studyomapp.com",
      "description": "Pilates ve PT eğitmenleri için danışan takip programı. Seans paketi, yoklama, randevu, ders hatırlatma, mesaj ve ödeme takibi tek yerde. Beta süresince ücretsiz.",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "inLanguage": "tr-TR",
      "publisher": { "@id": "https://studyomapp.com/#organization" },
      "offers": {
        "@type": "Offer",
        "url": "https://studyomapp.com",
        "price": "0",
        "priceCurrency": "TRY",
        "availability": "https://schema.org/InStock",
        "description": "Beta süresince ücretsiz"
      }
    }
  ]
}
```

FAQPage: isteğe bağlı ayrı blok olarak mevcut haliyle kalabilir (`@graph` içine `{"@type":"FAQPage","@id":"https://studyomapp.com/#faq","isPartOf":{"@id":"https://studyomapp.com/#webpage"},"mainEntity":[...]}` şeklinde de taşınabilir). SERP faydası yok.

## 5. Eğitmen sayfası için düzeltilmiş şablon

```json
{
  "@context": "https://schema.org",
  "@type": "SportsActivityLocation",
  "@id": "https://studyomapp.com/ornek-slug#place",
  "name": "Ayşe Yılmaz",
  "description": "Reformer pilates ve birebir seanslar",
  "url": "https://studyomapp.com/ornek-slug",
  "inLanguage": "tr-TR",
  "image": "https://studyomapp.com/profil/kapak.jpg",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Kadıköy",
    "addressRegion": "İstanbul",
    "addressCountry": "TR"
  },
  "sameAs": ["https://instagram.com/ornek"],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Ders paketleri",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": { "@type": "Service", "name": "10 seanslık paket" },
        "price": "4500.00",
        "priceCurrency": "TRY"
      }
    ]
  }
}
```
(Değerler örnektir; gerçek veriden üretin. Boş alanları ve boş kataloğu hiç yazmayın.)

## 6. Skor dökümü
Geçerlilik/sözdizimi 22/25, varlık kapsamı (Organization/WebSite eksik) 12/25, Google uygunluğu (yazılım zengin sonucu ve FAQ kaldırıldı) 10/20, özellik doğruluğu/tutarlılık 11/15, eğitmen sayfası 7/15 = **62/100**.
