# GEO / AI Arama Hazırlığı: studyomapp.com

Tarih: 2026-09-30 · Kapsam: landing (`/`), `robots.txt`, `sitemap.xml`, keşif dosyaları, ajan erişilebilirliği
Kaynaklar: `src/app/robots.ts`, `src/app/page.tsx`, `src/app/sitemap.ts`, `src/lib/config.ts`, canlı yanıtlar (curl, 15 farklı bot UA), render JSON (`mode_used: raw`, `is_spa: false`)

## GEO Hazırlık Puanı: 52 / 100

| Boyut | Ağırlık | Puan | Katkı | Özet |
|---|---|---|---|---|
| Alıntılanabilirlik | %25 | 55 | 13.8 | SSS iyi ve doğrudan; "Stüdyom nedir" tanım bloğu yok, özellik metinleri 25-40 kelime, kaynaklı veri yok |
| Yapısal okunabilirlik | %20 | 70 | 14.0 | Tek H1, düzgün H2/H3, landmark'lar, `<details>` SSS; H2'ler soru değil, pazarlama cümlesi |
| Çoklu ortam | %15 | 35 | 5.3 | `<img>` yok, video yok; demolar HTML/SVG maket (metin olarak okunur ama görsel sinyal yok) |
| Otorite ve marka | %20 | 15 | 3.0 | Organization/kurucu/hakkında/iletişim yok, `sameAs` yok, tarih yok, dış anılma yok, jenerik isim |
| Teknik erişilebilirlik | %20 | 80 | 16.0 | Prerender SSR, tüm botlara 200, robots açık; `llms.txt` yok, sitemap'te noindex sayfa, `lastmod` eksik |
| **Toplam** | | | **52** | |

Yeni bir domain için teknik taban sağlam. Puanı aşağı çeken şey sayfa değil, sitenin dışı: varlık (entity) sinyali ve dış anılma sıfır.

### Platform bazlı tahmini puanlar

| Platform | Puan | Belirleyici |
|---|---|---|
| Google AI Overviews | 45 | Googlebot erişimi ve FAQPage şeması iyi; ama AIO büyük ölçüde zaten sıralanan sayfalardan alıntı yapar, yeni domain henüz sıralanmıyor |
| ChatGPT Search | 35 | OAI-SearchBot açık; ChatGPT büyük ölçüde Bing dizinine ve marka anılmalarına (Reddit, forum, liste yazıları) dayanır, ikisi de yok |
| Perplexity | 40 | PerplexityBot açık, SSS blokları kolay çıkarılır; Perplexity taze ve kaynaklı karşılaştırma içeriğini sever, yok |
| Bing Copilot | 40 | bingbot açık; Bing Webmaster Tools doğrulaması / IndexNow izlenmedi, ikisi de hızlı kazanım |

---

## 1. AI tarayıcı erişimi (robots.txt)

Kaynak `src/app/robots.ts`, canlı `https://studyomapp.com/robots.txt` ile birebir aynı. Tek kural `User-Agent: *` + `Allow: /`, uygulama/portal/kayıt yolları kapalı. Ayrıca 15 bot user-agent'ı ile canlı istek atıldı; Hostinger CDN (hcdn) hiçbirini engellemiyor, hepsi `200` ve aynı boyutta (171.836 bayt) HTML aldı.

| Bot | Yönettiği yetenek | Durum |
|---|---|---|
| OAI-SearchBot | ChatGPT Search'te görünme ve alıntı | İzinli (robots + canlı 200) |
| ChatGPT-User | Kullanıcı isteğiyle anlık sayfa okuma | İzinli |
| GPTBot | Yalnızca OpenAI model eğitimi (ChatGPT Search değil) | İzinli |
| Claude-SearchBot | Claude arama sonuçlarında alıntı | İzinli |
| Claude-User | Kullanıcı isteğiyle anlık okuma | İzinli |
| ClaudeBot | Yalnızca Anthropic model eğitimi | İzinli |
| PerplexityBot | Perplexity arama dizini | İzinli |
| Perplexity-User | Kullanıcı isteğiyle anlık okuma | İzinli |
| Googlebot | Google Arama **ve AI Overviews / AI Mode** | İzinli |
| Google-Extended | Gemini/Vertex eğitimi ve grounding; Arama/AIO'ya etkisi yok | İzinli (wildcard) |
| bingbot | Bing + Copilot + dolaylı olarak ChatGPT | İzinli |
| Applebot | Siri/Spotlight/Safari keşfi | İzinli |
| Applebot-Extended | Yalnızca Apple Intelligence eğitimi | İzinli (wildcard) |
| CCBot, cohere-ai, Bytespider, meta-externalagent | Eğitim | İzinli (wildcard) |

**Önem: Bilgi.** Görünürlük için gereken her şey açık. Eğitim botlarını da açık bırakmak bir tercih; yeni ve tanınmayan bir marka için eğitim verisine girmek, modellerin "Stüdyom"u tanımasına yardım eder. Değiştirmeye gerek yok.

**Öneri (Düşük):** Kararı belgelemek için `robots.ts`'e arama botlarını adıyla yazan açık bir blok eklenebilir (`OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`). Davranışı değiştirmez, ileride biri `*`'ı daraltırsa arama botlarının yanlışlıkla kapanmasını önler.

## 2. llms.txt ve lisanslama

- `/llms.txt` → **404** (eksik). `/llms-full.txt` → 404.
- RSL 1.0 (`/license.xml`, robots'ta `License:` satırı) → yok.
- `/.well-known/security.txt`, `/.well-known/mcp.json`, `/.well-known/ai-plugin.json` → 404.

**Önem: Orta.** `llms.txt` bugün büyük AI aramalarının sıralama sinyali değil (Google açıkça kullanmadığını söylüyor). Yine de kodlama/araştırma ajanları ve bazı araçlar okuyor, maliyeti çok düşük ve ürünün ne olduğunu tek yerde, çelişkisiz anlatır.

**Düzeltme:** `src/app/llms.txt/route.ts` (statik `text/plain`) ile şu içerik:

```
# Stüdyom

> Türkiye'deki pilates eğitmenleri ve personal trainer'lar için web tabanlı danışan ve seans takip programı. Seans paketi, yoklama, randevu, ders hatırlatma, mesajlaşma ve IBAN ile ödeme takibi. Beta süresince ücretsiz.

- Dil: Türkçe · Para birimi: TL · Platform: web (PWA), iOS ve Android tarayıcı
- Danışanlar uygulama indirmez; kişisel link ile tarayıcıdan kullanır.
- Ödemeler Stüdyom'dan geçmez, komisyon yoktur.

## Sayfalar
- [Ana sayfa](https://studyomapp.com/): özellikler, nasıl çalışır, SSS
- [KVKK Aydınlatma Metni](https://studyomapp.com/kvkk)
- [Kullanım Koşulları](https://studyomapp.com/kosullar)
```

RSL: SaaS pazarlama sitesi için gerekmez; **atlanabilir**. `security.txt` (info@studyomapp.com) ise 5 dakikalık iş ve güven sinyali; **Düşük** öncelikle eklenebilir.

## 3. Alıntılanabilirlik (landing pasajları)

Değerlendirme trafilatura çıktısı (`extracted_text`, 5.923 karakter) üzerinden yapıldı.

**Güçlü yanlar**
- SSS'deki 7 cevap "Hayır." / "Evet." ile başlıyor, 20-50 kelime, bağlamsız okunabiliyor. AI'ın en kolay alıntıladığı biçim bu. JSON-LD FAQPage ile birebir eşleşiyor.
- Ayırt edici, doğrulanabilir iddialar var: "danışan uygulama indirmez", "ödemeler bizden geçmez, komisyon almayız", "sağlık bilgisi açık rıza olmadan alınmaz", "iOS 16.4 ya da üstü". Bunlar "hangi pilates programı komisyon almıyor" gibi sorgularda alıntı adayı.

**Bulgular**

| # | Önem | Bulgu | Kanıt | Düzeltme |
|---|---|---|---|---|
| C1 | **Yüksek** | Sayfada "Stüdyom nedir?" tanım cümlesi yok. H1 "Defteri bırakın. Danışan ve seans takibini Stüdyom yapsın." slogan; ürün kategorisi (danışan takip programı), hedef kitle ve ülke tek cümlede bir arada geçmiyor. Tanım yalnızca meta description ve JSON-LD'de. | `page.tsx` hero; `extracted_text` ilk satırlar | Hero altına veya SSS'nin ilk sorusu olarak 40-60 kelimelik tanım: "Stüdyom, Türkiye'deki pilates eğitmenleri ve personal trainer'lar için web tabanlı bir danışan ve seans takip programıdır. Seans paketlerini, yoklamayı, randevuları, ders hatırlatmalarını ve IBAN ile gelen ödemeleri tek yerden yönetirsiniz. Danışanlar uygulama indirmez. Beta süresince ücretsizdir." |
| C2 | **Yüksek** | Türk eğitmenlerin AI'a soracağı sorgular karşılanmıyor: "pilates stüdyosu için en iyi program", "seans paketi nasıl takip edilir", "telafi hakkı / 24 saat iptal kuralı nasıl uygulanır", "Excel mi program mı". Sayfa yalnızca kendini anlatıyor. | `extracted_text`, SSS listesi | SSS'ye 4-6 soru ekle: "Pilates stüdyosu için hangi program kullanılır?", "24 saat iptal kuralı nasıl çalışır?", "Telafi hakkı nedir, seans yanar mı?", "Beta bitince ücret ne olacak?", "Verilerimi dışa aktarabilir miyim?". Uzun vadede `/rehber/...` altında 600-1200 kelimelik nasıl-yapılır yazıları (seans paketi fiyatlandırma, iptal politikası şablonu). |
| C3 | Orta | Özellik metinleri 25-40 kelime ve "siz/danışan" bağlamına dayanıyor; tek başına alıntılanınca ürün adı geçmiyor ("Tek dokunuşla işaretleyin, kalan seans hemen güncellensin."). | `FEATURES` dizisi, `page.tsx` | Her özellik metninin ilk cümlesine özne olarak "Stüdyom'da ..." ekle ki çıkarılan pasaj markayı taşısın. Uzunluğu zorla 130-170 kelimeye çıkarmaya gerek yok (Google içeriği parçalamanın gerekmediğini söylüyor); özne ve somutluk daha önemli. |
| C4 | Orta | Sayısal iddia az ve kaynaksız. Mevcut sayılar: "₺0", "0 uygulama", "4 hafta". Pazar/sorun verisi yok. | İstatistik şeridi | Beta verisi biriktikçe gerçek sayılar ekle ("Beta'da N eğitmen, haftada M yoklama"). Uydurma veya kaynaksız sektör istatistiği koyma. |
| C5 | Düşük | "Stüdyom ücretli mi?" cevabı 12 kelime ve beta sonrasını açıklamıyor; AI "şu an ücretsiz ama belirsiz" diye aktarabilir. | SSS son soru | Beta sonrası niyeti tek cümleyle yaz (ör. "Beta'ya katılan eğitmenler fiyatlandırma başlamadan önce haber alır."). |

## 4. Yapısal okunabilirlik

- Tek `<h1>`, 7 `<h2>`, 20 `<h3>`; hiyerarşi mantıklı. `<header>`, `<main>`, 2 `<nav>`, `<footer>`, 8 `<section>` var. SSS `<details>/<summary>`: içerik HTML'de, JS olmadan okunur. `lang="tr"`.
- **S1 (Orta):** H2'ler iki `<span>`'a bölünmüş pazarlama cümleleri ("Derslerden ödemelere her şey tek yerde. Deftere, Excel'e…"). Metin olarak birleşiyor, sorun değil; ama hiçbiri konu/soru belirtmiyor. **Düzeltme:** Görsel başlığı koruyup bölüm etiketlerini ("Özellikler", "Nasıl çalışıyor", "SSS") H2 yap, slogan kısmını altına paragraf olarak al; ya da H2'yi "Stüdyom'un özellikleri: …" biçimine çevir.
- **S2 (Düşük):** Hiç soru biçimli H2/H3 yok (SSS soruları `<summary>` içinde, başlık değil). AI çıkarıcıları için sorun değil, FAQPage şeması bunu telafi ediyor. İsteğe bağlı: `<summary>` içine `<h3>` koymak.

## 5. Çoklu ortam

- **M1 (Orta):** Sayfada `<img>` yok; 39 `<svg>` (ikonlar, `aria-hidden`). Özellik demoları React ile çizilmiş telefon maketleri: metinleri okunuyor ama görsel arama ve çoklu ortamlı AI cevapları (Google AIO görsel kartları, Perplexity görselleri) için kullanılabilir gerçek ekran görüntüsü yok. **Düzeltme:** 3-4 gerçek ekran görüntüsü (yoklama, eğitmen sayfası, paket) `next/image` ile, açıklayıcı Türkçe `alt` metniyle; `SoftwareApplication.screenshot` alanına da ekle.
- **M2 (Orta, sayfa dışı):** Video yok. YouTube anılmaları AI alıntısıyla en yüksek korelasyonlu marka sinyali (~0.74). **Düzeltme:** 60-90 saniyelik "Yoklama nasıl alınır / paket nasıl düşer" ekran kaydı, YouTube'a Türkçe başlık + açıklama + studyomapp.com linkiyle; landing'e gömülü (lite embed) ve `VideoObject` şemasıyla.
- OG görseli (1200x630, alt metinli) mevcut.

## 6. Otorite, varlık (entity) ve marka sinyalleri

| # | Önem | Bulgu | Kanıt | Düzeltme |
|---|---|---|---|---|
| A1 | **Kritik** | Varlık tanımı yok. JSON-LD'de yalnızca `SoftwareApplication` + `FAQPage`; `Organization` / `WebSite` yok, `publisher`, `logo`, `sameAs`, `founder`, `email` yok. "Stüdyom" jenerik bir Türkçe kelime ("benim stüdyom"); Türkiye'de bu adı taşıyan çok sayıda gerçek stüdyo var. Model bu markayı başka "Stüdyom"lardan ayıracak hiçbir bağ bulamıyor. | render JSON `structured_data.blocks[0].types`; `page.tsx` JSON-LD | `Organization` (`name: "Stüdyom"`, `alternateName: ["Stüdyom App", "studyomapp"]`, `url`, `logo`, `email: info@studyomapp.com`, `founder: Person "Abdulsamed Dağlı"`, `sameAs: [Instagram, LinkedIn, YouTube…]`) ve `WebSite` ekle; `SoftwareApplication.publisher` → `@id` ile Organization'a bağla. Metinde de ilk geçişte "Stüdyom (studyomapp.com)" kullan. |
| A2 | **Yüksek** | Kim yaptı belli değil: hakkında sayfası, kurucu adı, iletişim adresi sayfada yok (e-posta yalnızca KVKK metninde). AI'lar ve kullanıcılar için güven sinyali sıfır. | Footer linkleri: `/kvkk`, `/kosullar`, `/giris`, `#sss` | Kısa `/hakkinda` sayfası: kim, neden, nerede (Türkiye), iletişim; footer'a e-posta. Sitemap'e ekle. |
| A3 | **Yüksek** | Dış anılma yok (yeni domain). Wikipedia/Wikidata: yok (bu aşamada beklenmez). Reddit, Ekşi Sözlük, YouTube, LinkedIn: tespit edilen resmi hesap/anılma yok. Instagram beta kanalı olarak planlanmış ama sitede linki yok. | Footer ve JSON-LD'de sosyal link yok | Instagram ve LinkedIn şirket sayfası aç, sitede ve `sameAs`'ta linkle. Türk pilates/PT topluluklarında (Instagram eğitmen hesapları, Ekşi, r/Turkey, Facebook eğitmen grupları) gerçek kullanım anlatımı; "pilates stüdyo programları karşılaştırma" türü Türkçe liste yazılarına dahil olmak için blog/yayın temasları. ChatGPT ve Perplexity alıntıyı büyük ölçüde bu üçüncü taraf sayfalardan yapar. |
| A4 | Orta | Tarih sinyali yok: `publication_date: None`, sitemap'te landing için `lastmod` yok, şemada `dateModified` yok. | `sitemap.xml`, render JSON | `sitemap.ts`'te landing ve yasal sayfalara gerçek `lastModified`; `SoftwareApplication`'a `softwareVersion` ("beta") ve `dateModified`. |
| A5 | Düşük | Marka adı yazımı: sayfa "Stüdyom", domain "studyomapp". Kullanıcılar "studyom", "stüdyom app" diye arayacak. | `config.ts` | `alternateName` (A1) bunu çözer. |

## 7. Teknik erişilebilirlik

- **İyi:** Sayfa prerender (`x-nextjs-prerender: 1`, `x-nextjs-cache: HIT`), `is_spa: false`; tüm içerik ilk HTML'de. JS çalıştırmayan botlar (GPTBot, ClaudeBot, PerplexityBot JS render etmez) her şeyi görüyor. Canonical mutlak (`https://studyomapp.com`), `http` → 301, `lang="tr"`, `og:locale tr_TR`.
- **T1 (Yüksek):** `sitemap.xml` içinde `https://studyomapp.com/testpilates` var, ama sayfa `<meta name="robots" content="noindex">` dönüyor ve başlığı sadece "Stüdyom". Sitemap'te noindex URL çelişkili sinyal; ayrıca test hesabı prod sitemap'ine sızmış. **Düzeltme:** `sitemap.ts` yalnızca yayında ve indekslenebilir eğitmen sayfalarını listelesin (noindex koşuluyla aynı filtre); test hesabını yayından kaldır veya sil.
- **T2 (Orta):** Bing Webmaster Tools + IndexNow izi yok. ChatGPT Search ve Copilot Bing dizinine dayanıyor; yeni domain için en hızlı yol. **Düzeltme:** Bing Webmaster'a siteyi ekle (Google Search Console'dan içe aktarılabilir), sitemap'i gönder; isteğe bağlı IndexNow anahtarı.
- **T3 (Düşük):** Canlı yanıtta hâlâ `x-powered-by: Next.js` ve yalnızca `content-security-policy: upgrade-insecure-requests` var; son commit'teki güvenlik başlıkları (20167f9) prod'a henüz yansımamış görünüyor. GEO etkisi yok, deploy kontrolü için not.
- **T4 (Düşük):** `Cache-Control: s-maxage=31536000` (1 yıl). İçerik güncellenince CDN'in eski HTML'i uzun süre sunma riski; tazelik sinyali için deploy'da purge yapıldığından emin ol.

## 8. Ajan hazırlığı (AI ajanlarının siteyi kullanması)

**Erişilebilirlik ağacı (ajanlar için):**
- Landmark'lar tam (`header/main/nav/footer`), `nav`'lar `aria-label`'lı ("Alt bilgi"), 37 `aria-label`, dekoratif SVG'ler `aria-hidden`. İyi.
- Tüm CTA'lar gerçek `<a href="/giris">` (sayfada `<button>` yok); ajanlar kayıt yoluna tıklayarak ulaşabilir. SSS `<details>` yerel kontrol, erişilebilir.
- **G1 (Düşük):** 14 linkin 5'i aynı `/giris` hedefine gidiyor; metinleri farklı ("Ücretsiz başlayın" vb.) ama hedefin kayıt mı giriş mi olduğu linkten anlaşılmıyor. Ajan "hesap aç" niyetini `/giris` ile eşlemekte zorlanabilir. **Düzeltme:** CTA'larda net metin ("Ücretsiz hesap aç") veya `/giris?mod=kayit` gibi ayrışan URL.
- **G2 (Bilgi):** `robots.txt` `/giris`'i kapatıyor; bu, arama botları için doğru. Kullanıcı adına çalışan ajanlar (ChatGPT agent, Claude-User) robots'a uymak zorunda değil ve sayfayı açabilir; form alanlarının `<label>`'lı olması (commit 34e0b11 doğrulama) ajan uyumluluğu için yeterli.

**Keşif dosyaları:**

| Dosya | Durum |
|---|---|
| `/robots.txt` | Var, doğru |
| `/sitemap.xml` | Var, noindex URL içeriyor (T1) |
| `/manifest.webmanifest` | Var (`start_url: /bugun`, kapalı alan; ajan/keşif için sorun değil) |
| `/llms.txt` | **Yok** (bkz. bölüm 2) |
| `/.well-known/security.txt` | Yok |
| `/.well-known/mcp.json`, `ai-plugin.json` | Yok (bu aşamada gerek yok) |
| RSL `license.xml` | Yok (gerek yok) |

## 9. En yüksek etkili 5 değişiklik

| Sıra | Değişiklik | Etki | Efor |
|---|---|---|---|
| 1 | `Organization` + `WebSite` JSON-LD (logo, e-posta, kurucu, `alternateName`, `sameAs`), `SoftwareApplication.publisher` bağlantısı (A1) | Varlık belirsizliğini çözer; tüm platformlar | 1 saat |
| 2 | Hero'ya veya SSS başına 40-60 kelimelik "Stüdyom nedir" tanımı + 4-6 yeni kategori sorusu SSS'ye (C1, C2) | Alıntılanabilir cevap sayısını ikiye katlar | 2 saat |
| 3 | Instagram / LinkedIn / YouTube resmi hesapları, sitede ve `sameAs`'ta; 60-90 sn YouTube demo videosu (A3, M2) | En güçlü dış sinyal (YouTube ~0.74 korelasyon) | 1 gün + süreklilik |
| 4 | Sitemap'ten noindex `/testpilates`'i çıkar, `lastModified` ekle; Bing Webmaster + sitemap gönder (T1, A4, T2) | Temiz tarama; ChatGPT/Copilot için Bing dizinine giriş | 1 saat |
| 5 | `/hakkinda` sayfası + `llms.txt` + `security.txt` (A2, bölüm 2) | Güven ve ajan keşfi | 2 saat |

Orta vadede asıl kaldıraç (efor: haftalar): Türk eğitmenlerin sorduğu sorulara cevap veren `/rehber` içerikleri ve üçüncü taraf Türkçe karşılaştırma/liste yazılarında anılmak. Sayfanın teknik kısmı hazır; sıralanan ve anılan bir kaynak olmadan AI Overviews ve ChatGPT alıntısı gelmez.

---

## audit-data.json (AI Search Readiness)

```json
{
  "category": "AI Search Readiness",
  "score": 52,
  "dimensions": {"citability": 55, "structural_readability": 70, "multimodal": 35, "authority_brand": 15, "technical_accessibility": 80},
  "platform_scores": {"google_aio": 45, "chatgpt_search": 35, "perplexity": 40, "bing_copilot": 40},
  "crawler_access": {"OAI-SearchBot": "allowed", "ChatGPT-User": "allowed", "GPTBot": "allowed", "Claude-SearchBot": "allowed", "Claude-User": "allowed", "ClaudeBot": "allowed", "PerplexityBot": "allowed", "Perplexity-User": "allowed", "Googlebot": "allowed", "Google-Extended": "allowed", "bingbot": "allowed", "Applebot": "allowed", "Applebot-Extended": "allowed", "CCBot": "allowed", "cohere-ai": "allowed", "cdn_ua_blocking": false},
  "llms_txt": "missing",
  "rsl": "missing",
  "findings": [
    {"id": "A1", "severity": "critical", "title": "Organization/WebSite şeması ve sameAs yok; jenerik marka adı", "fix": "Organization + WebSite JSON-LD, alternateName, sameAs, publisher bağlantısı"},
    {"id": "C1", "severity": "high", "title": "Sayfada 'Stüdyom nedir' tanım pasajı yok", "fix": "Hero/SSS'ye 40-60 kelimelik tanım"},
    {"id": "C2", "severity": "high", "title": "Kategori sorguları (pilates programı, iptal kuralı, telafi) karşılanmıyor", "fix": "SSS'ye 4-6 soru, /rehber içerikleri"},
    {"id": "A2", "severity": "high", "title": "Hakkında/kurucu/iletişim bilgisi yok", "fix": "/hakkinda sayfası, footer'da e-posta"},
    {"id": "A3", "severity": "high", "title": "Dış marka anılması ve sosyal profil yok", "fix": "Instagram/LinkedIn/YouTube, topluluk ve liste yazıları"},
    {"id": "T1", "severity": "high", "title": "Sitemap noindex /testpilates içeriyor", "fix": "sitemap.ts'i indekslenebilir sayfalarla sınırla"},
    {"id": "llms", "severity": "medium", "title": "llms.txt yok", "fix": "src/app/llms.txt/route.ts"},
    {"id": "C3", "severity": "medium", "title": "Özellik pasajlarında marka özne olarak geçmiyor", "fix": "İlk cümleye 'Stüdyom'da ...'"},
    {"id": "M1", "severity": "medium", "title": "Gerçek ekran görüntüsü yok", "fix": "next/image + alt + SoftwareApplication.screenshot"},
    {"id": "M2", "severity": "medium", "title": "Video yok", "fix": "YouTube demo + VideoObject"},
    {"id": "A4", "severity": "medium", "title": "Tarih sinyali yok", "fix": "sitemap lastModified, dateModified"},
    {"id": "S1", "severity": "medium", "title": "H2'ler konu belirtmeyen sloganlar", "fix": "Bölüm adlarını H2 yap"},
    {"id": "T2", "severity": "medium", "title": "Bing Webmaster/IndexNow yok", "fix": "Siteyi Bing'e ekle, sitemap gönder"},
    {"id": "G1", "severity": "low", "title": "5 CTA aynı /giris hedefine gidiyor, kayıt niyeti ayrışmıyor", "fix": "Net CTA metni veya ayrı URL"},
    {"id": "T3", "severity": "low", "title": "Güvenlik başlıkları prod'da görünmüyor (x-powered-by duruyor)", "fix": "Deploy'u doğrula"}
  ]
}
```
