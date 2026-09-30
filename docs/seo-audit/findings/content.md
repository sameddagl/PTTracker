# İçerik Kalitesi Denetimi: studyomapp.com

Tarih: 30 Eylül 2026 · Kapsam: `/` (ana sayfa), `/kvkk`, `/kosullar` · Kaynak: canlı HTML (render_page, `extracted_text`) + `src/app/page.tsx`, `src/components/landing/*`
Kod değiştirilmedi. Yorum ve üretimle ilgili kurallar: yorum/referans uydurulmayacak; metin doğal Türkçe olacak, "kolayca / sizin için / artık" gibi dolgu sözcükler kullanılmayacak.

## Özet puanlar

| Alan | Puan |
|---|---|
| **İçerik kalitesi (genel)** | **64 / 100** |
| E-E-A-T (ağırlıklı) | 46 / 100 |
| AI alıntılanabilirlik (citation readiness) | 60 / 100 |
| Okunabilirlik (Türkçe) | 82 / 100 |
| Şablon metadata riski | Düşük (templated_ratio 0.0, ortak CTA yok) |

### E-E-A-T dağılımı (bu skill'in iç modeli; Google sayısal ağırlık yayımlamaz)

| Faktör | Ağırlık | Puan | Gerekçe |
|---|---|---|---|
| Experience (Deneyim) | %20 | 45 | Telafi hakkı, 24 saat iptal kuralı, düet paketi, IBAN + dekont, "Hepsi geldi" gibi ayrıntılar sahayı bilen birinin yazdığını gösteriyor. Ama ürünün neden ve kim tarafından yapıldığına dair birinci ağızdan tek cümle yok. |
| Expertise (Uzmanlık) | %25 | 45 | Ürün bilgisi doğru ve somut (iOS 16.4, CSV sütun eşleştirme, veritabanı düzeyinde ayrım). Kurucunun geçmişi, stüdyo/eğitmen ilişkisi hiçbir yerde anlatılmıyor. |
| Authoritativeness (Otorite) | %25 | 20 | Yeni alan adı, dış bağlantı/basın/topluluk izi yok. Beta aşamasında beklenen durum; uydurma ile kapatılmamalı. |
| Trustworthiness (Güven) | %30 | 70 | KVKK metni ve koşullar güçlü: veri sorumlusu adıyla belirtilmiş, veri işleyenler ve veri merkezi konumları listelenmiş, "komisyon almayız", 30 gün önceden fiyat bildirimi. Eksik: ana sayfada iletişim e-postası ve arkasındaki kişi görünmüyor. |

Ağırlıklı: 0,2×45 + 0,25×45 + 0,25×20 + 0,3×70 = **46**

### Ölçümler

- Ana sayfa `extracted_text`: ~744 sözcük (ana sayfa alt sınırı 500: geçiyor). `/kvkk` ~828, `/kosullar` ~463 sözcük.
- Ortalama cümle uzunluğu: 8,5 sözcük; sözcük başına ~2,75 hece. Ateşman okunabilirlik: **~66** ("orta-kolay"). Kısa, emir kipli cümleler sektöre uygun.
- Dolgu sözcük taraması: "kolayca" 0, "sizin için" 0, "artık" 0, "hemen" 1. Kurala büyük ölçüde uyuluyor.
- Anahtar kelimeler (görünür metinde birebir): "pilates stüdyo programı" **0**, "personal trainer uygulaması" **0**, "danışan takip programı" **0** (yalnızca meta description'da), "seans takip(i)" 1 (H1). "danışan" 28, "seans" 12, "yoklama" 7: doğal yoğunluk, doldurma yok.
- Yapısal veri: SoftwareApplication + FAQPage, geçerli; SSS cevapları görünür metinle birebir aynı (iyi).
- Metadata şablon kontrolü (`metadata_template.py`, 3 sayfa): `site_risk: low`, `templated_ratio: 0.0`, `shared_cta_phrases: {}`. Başlık/açıklama çiftleri tekrar ya da stok CTA içermiyor.
- Özellik demoları (`feature-demos.tsx`, `phone-mockup.tsx`) `aria-hidden`; arama motoru ve AI için içerik sayılmıyor. Bu doğru bir tercih, ama sayfada gerçek ekran görüntüsü (alt metinli `<img>`) de yok.

---

## Bulgular

### 1. [Yüksek] Hedef aramalar görünür metinde yok; tek sayfa dört farklı niyeti taşıyamıyor

**Kanıt:** "pilates stüdyo programı", "personal trainer uygulaması", "danışan takip programı" ifadeleri yalnızca `metadata.keywords` (Google kullanmaz) ve meta description'da geçiyor. H1 "Defteri bırakın. Danışan ve seans takibini Stüdyom yapsın." içinde "pilates" yok. Dört arama dört ayrı niyet: stüdyo sahibi, PT, genel danışan yönetimi, paket/seans sayımı.

**Düzeltme:**
- Ana sayfada bir kez, doğal şekilde: hero alt metnini şöyle açın:
  > "Pilates eğitmenleri ve personal trainer'lar için danışan ve seans takip programı. Yoklamayı tek dokunuşla alın, kalan seans paketten düşsün; kimin ne kadar borcu olduğunu her an görün."
- "Özellikler" H2'sini niyete yaklaştırın: "Derslerden ödemelere her şey tek yerde." yerine
  > "Seans paketi, randevu, yoklama ve ödeme takibi aynı ekranda."
- Orta vadede her niyet için **gerçekten farklı** içerikli ayrı sayfalar: `/pilates-studyo-programi`, `/personal-trainer-uygulamasi`, `/seans-paketi-takibi`. Her biri o kitlenin gününü anlatmalı (reformer grup dersi kontenjanı, PT'de salon dışı ders ve ölçüm, paket yenileme vb.). Aynı metni şehir/branş değiştirerek çoğaltmayın; bu doorway/thin içerik olur (ayrıntı için `seo-programmatic`).

### 2. [Yüksek] Arama niyeti uyuşmazlığı: "stüdyo programı" arayan çoğunlukla çok eğitmenli stüdyo sahibi

**Kanıt:** Ürün tek başına çalışan eğitmene göre (her eğitmen yalnızca kendi danışanlarını görür). Sayfada "birden çok eğitmenli stüdyo" sorusu hiç cevaplanmıyor; stüdyo sahibi sayfaya gelip ürünün ona uyup uymadığını anlayamıyor, geri dönüyor.

**Düzeltme:** SSS'ye açık bir soru ekleyin (yalnızca doğru olanı yazın):
> **Stüdyomda birden fazla eğitmen var, kullanabilir miyim?**
> Stüdyom şu an kendi danışanlarıyla çalışan eğitmen için. Her eğitmen kendi hesabını açar ve yalnızca kendi danışanlarını görür. Birden çok eğitmenin aynı takvimi paylaştığı stüdyo hesabı beta sonrası için planlanıyor.

(Son cümleyi ancak plan gerçekse yazın.) Hero'da da kitleyi netleştirin: "Kendi danışanlarıyla çalışan pilates eğitmenleri ve personal trainer'lar için."

### 3. [Yüksek] Ürünün arkasındaki kişi ana sayfada görünmüyor (E-E-A-T / Güven)

**Kanıt:** Abdulsamed Dağlı ve info@studyomapp.com yalnızca `/kvkk` ve `/kosullar` içinde geçiyor. Ana sayfa footer'ında iletişim e-postası, "Hakkında" bağlantısı ya da kurucu adı yok. Yorum/referans olmayan bir beta üründe bu boşluğu dolduracak en güçlü sinyal, arkasında gerçek bir insan olduğunu göstermek.

**Düzeltme:**
- Footer'a: `İletişim: info@studyomapp.com` (mailto) ve "Hakkında" bağlantısı.
- Kısa bir `/hakkinda` sayfası ya da ana sayfada SSS öncesi küçük bir bölüm. Yalnızca gerçek bilgilerle, örnek iskelet:
  > **Stüdyom'u kim yapıyor?**
  > Stüdyom'u Abdulsamed Dağlı geliştiriyor. [Fikrin nereden çıktığı: örn. tanıdığı bir pilates eğitmeninin paketleri defterde ve WhatsApp'ta takip ettiğini görmesi — gerçek hikâyeyi yazın.] Beta süresince her geri bildirimi kendim okuyorum: info@studyomapp.com
- Kurucu fotoğrafı ve bir LinkedIn/Instagram profili bağlantısı (varsa) ekleyin. Organization + `founder` (Person) JSON-LD ile eşleyin (schema bulgularına bakın).
- Yorum, müşteri sayısı, "yüzlerce eğitmen" gibi ifadeler **uydurulmamalı**; gerçek beta kullanıcısı izin verirse adıyla tek bir alıntı sonradan eklenebilir.

### 4. [Orta] Kendi içinde çelişen ifade: "kurulum gerekmez" ve "Kurulum birkaç dakika sürer"

**Kanıt:** İstatistik bölümü H2: "Başlamak için kart bilgisi ya da kurulum gerekmez." Nasıl çalışıyor: "Akşam kurun, ertesi gün kullanın." Son CTA: "Kurulum birkaç dakika sürer."

**Düzeltme:** H2'yi şöyle değiştirin:
> "Başlamak için kart bilgisi ya da uygulama indirmek gerekmez."

Ya da "kurulum" yerine "hazırlık" deyin: "Hazırlık birkaç dakika sürer."

### 5. [Orta] İstatistik bölümü zayıf ve çeviri kokuyor

**Kanıt:** "0 · İndirmeniz gereken uygulama" (İngilizce "0 apps to download" kalıbı), "4 hafta · Grup dersleri takvimde hep bu kadar ileriye hazır" (devrik ve anlaşılması zor). "₺0" ile "Kredi kartı gerekmez / kart bilgisi" sayfada 4 kez tekrarlanıyor.

**Düzeltme:** Ürünün gerçek ve somut sayılarını kullanın, örneğin:
- "₺0 · Beta boyunca ücret yok"
- "%0 · Ödemelerden komisyon almıyoruz"
- "1 gün önce · Danışana ders hatırlatması gider"
- "4 hafta · Grup dersleri takvimde dört hafta ileriye kadar açık"

"0 indirilecek uygulama" kartını çıkarın; bu bilgi hero'da zaten var.

### 6. [Orta] Beta sonrası belirsizliği ana sayfada cevapsız

**Kanıt:** `/kosullar`: "Ücretli bir plana geçilecekse bu, en az 30 gün önceden bildirilir; ücretli plana geçmek sizin tercihinizdir." Ana sayfadaki "Stüdyom ücretli mi?" cevabı yalnızca "Beta süresince ücretsiz. Kart bilgisi de istemiyoruz." diyor. Eğitmenin asıl kaygısı "verilerimi girdikten sonra ne olacak?".

**Düzeltme:** SSS cevabını genişletin:
> "Beta süresince ücretsiz, kart bilgisi istemiyoruz. İleride ücretli plana geçilirse en az 30 gün önceden haber veririz; devam edip etmemek size kalır. Verilerinizi istediğiniz an Excel olarak indirebilirsiniz."

### 7. [Orta] Güven sinyalleri yasal sayfalarda gömülü; ana sayfaya taşınmalı

**Kanıt:** Verilerin Frankfurt (AB) veri merkezinde tutulduğu, hesap silinince danışan verisinin kalıcı silindiği, veri ihlalinde bildirim yapılacağı yalnızca `/kosullar` içinde. Ana sayfa "bu ayrım doğrudan veritabanında yapılır" diyor ama nerede saklandığını söylemiyor.

**Düzeltme:** SSS'ye:
> **Verilerim nerede saklanıyor?**
> Veriler Almanya'daki (Frankfurt) bir veri merkezinde tutulur. Satılmaz, reklam için kullanılmaz. Hesabınızı sildiğinizde danışan kayıtlarınız da kalıcı olarak silinir. Ayrıntılar KVKK Aydınlatma Metni'nde.

(KVKK sayfasına bağlantı verin.)

### 8. [Orta] AI alıntılanabilirlik: tanım cümlesi ve bağımsız paragraflar eksik

**Kanıt:** Sayfada "Stüdyom nedir?" sorusuna tek cümlede cevap veren bir tanım yok; H1 slogan, özellik kartları başlık + 2 cümle. AI özetleri (AI Overviews, ChatGPT, Perplexity) "X, Y için Z'dir" kalıbındaki cümleleri alıntılar. SSS ve FAQPage şeması iyi bir temel; iOS 16.4, komisyon yok, IBAN'a doğrudan ödeme gibi doğrulanabilir bilgiler alıntılanabilir.

**Düzeltme:**
- SSS'nin başına:
  > **Stüdyom nedir?**
  > Stüdyom, Türkiye'de kendi danışanlarıyla çalışan pilates eğitmenleri ve personal trainer'lar için web tabanlı bir danışan ve seans takip programıdır. Seans paketlerini, yoklamayı, randevuları, ders hatırlatmalarını ve IBAN'a gelen ödemeleri tek hesapta tutar. Danışanlar uygulama indirmez; kendilerine gönderilen linki tarayıcıda açar.
- "Neden Stüdyom?" maddelerini kendi başına anlaşılır tutun (başlık okunmadan da anlamı olsun), zamirle başlayan cümlelerden kaçının.

### 9. [Düşük] Tekrarlayan kalıplar ve birkaç çeviri tadında ifade

**Kanıt ve öneri:**
| Mevcut | Sorun | Öneri |
|---|---|---|
| "tek dokunuşla" (4 kez) | Kalıp tekrarı, "one tap" çevirisi hissi | Birini bırakın; diğerlerinde "Geldi/gelmedi'yi işaretleyin", "bir dokunuşla" ya da hiç kullanmayın |
| "Derslerden ödemelere her şey tek yerde." | Jenerik SaaS sloganı ("all in one place") | "Seans paketi, randevu, yoklama ve ödeme aynı ekranda." |
| "Mağazadan indirmeden ana ekranda" | Yüklemsiz, devrik | "App Store'a gerek yok, ana ekrana ekleyin" |
| "kalan seans hemen güncellensin" | "hemen" dolgu | "kalan seans güncellensin" |
| "Görüldü" (çip) | Bağlamsız | "Okundu bilgisi" |
| "Instagram bio'nuza koyacağınız sayfa" | Doğal, kalsın | — |

Genel ton doğal; "Stüdyolarda iş nasıl dönüyorsa program da öyle çalışır", "Yabancı bir programın çevirisi değil", "Defteri bu akşam kapatın" iyi örnekler.

### 10. [Düşük] Derinlik: blog/rehber yok, tazelik sinyali yok

**Kanıt:** Sitede ana sayfa + iki yasal metin + eğitmen sayfaları dışında içerik yok. Ana sayfada tarih/sürüm bilgisi yok (açılış sayfası için sorun değil). Yasal sayfalarda "Son güncelleme: 30 Eylül 2026" sabit (`LEGAL.updatedOn`); doğru bir tazelik sinyali.

**Düzeltme:** Eğitmenin gerçekten aradığı, ürünün kendi deneyimine dayanan birkaç rehber (her biri 1.500+ sözcük, somut örnekli):
- "Pilates seans paketi nasıl fiyatlandırılır: peşin, taksit, düet" 
- "24 saat iptal kuralı ve telafi hakkı: danışana nasıl yazılır (hazır metin)"
- "Eğitmenler için KVKK: danışanın sağlık bilgisini alırken açık rıza"
- "Defterden Excel'e, Excel'den programa: danışan listesini taşımak"
Rehberlerde yazar kutusu (Abdulsamed Dağlı, iletişim) ve yayın/güncelleme tarihi bulunsun. Ana sayfaya kısa bir "Beta'da neler değişti" listesi (tarihli) eklemek de tazelik sinyali verir.

### 11. [Düşük] Gerçek ekran görüntüsü yok

**Kanıt:** Tüm görseller HTML ile çizilmiş ve `aria-hidden`. Arama motoru ve AI için ürünün neye benzediğine dair görsel/alt metin yok.

**Düzeltme:** En az 2 gerçek ekran görüntüsü (`<img>` + Türkçe alt): `alt="Stüdyom yoklama ekranı: grup dersinde dört danışanın geldi/gelmedi durumu ve kalan seans sayıları"`. Demolar kalabilir.

### 12. [Bilgi] Yasal sayfalar

`/kvkk` (~828 sözcük) ve `/kosullar` (~463 sözcük) iyi yazılmış: "Kısaca" özeti, KVKK m.5/2 bentlerine göre hukuki sebepler, veri sorumlusu/veri işleyen ayrımı, alt işleyenler ve veri merkezi ülkeleri açık. Metadata benzersiz, şablon değil. Tek öneri: `/kosullar` içinde iletişim e-postası ve fesih/hesap silme adımları ayrıca bir başlıkla görünür olsun (metnin kalanı alıntıda kesildiği için doğrulayın).

---

## Yapılandırılmış bulgular (audit-data.json, "Content Quality")

```json
{
  "category": "Content Quality",
  "score": 64,
  "eeat": { "experience": 45, "expertise": 45, "authoritativeness": 20, "trustworthiness": 70, "weighted": 46 },
  "ai_citation_readiness": 60,
  "readability": { "atesman": 66, "avg_words_per_sentence": 8.5, "score": 82 },
  "word_counts": { "/": 744, "/kvkk": 828, "/kosullar": 463 },
  "metadata_template": { "site_risk": "low", "templated_ratio": 0.0, "shared_cta_phrases": {} },
  "findings": [
    { "id": "content-keywords-missing", "severity": "high", "title": "Hedef aramalar görünür metinde yok, tek sayfa dört niyeti taşıyamıyor" },
    { "id": "content-intent-mismatch-studio", "severity": "high", "title": "Çok eğitmenli stüdyo sorusu cevapsız" },
    { "id": "eeat-founder-hidden", "severity": "high", "title": "Kurucu ve iletişim ana sayfada görünmüyor" },
    { "id": "copy-contradiction-kurulum", "severity": "medium", "title": "'kurulum gerekmez' ile 'Kurulum birkaç dakika sürer' çelişkisi" },
    { "id": "copy-stats-weak", "severity": "medium", "title": "İstatistik bölümü zayıf ve çeviri kokuyor" },
    { "id": "faq-post-beta", "severity": "medium", "title": "Beta sonrası fiyat/veri sorusu ana sayfada cevapsız" },
    { "id": "trust-signals-buried", "severity": "medium", "title": "Veri konumu ve silme güvenceleri yalnızca yasal sayfalarda" },
    { "id": "ai-definition-missing", "severity": "medium", "title": "Tanım cümlesi ('Stüdyom nedir?') yok" },
    { "id": "copy-repetition", "severity": "low", "title": "'tek dokunuşla' tekrarı ve birkaç çeviri tadında ifade" },
    { "id": "content-depth-no-guides", "severity": "low", "title": "Rehber/blog içeriği yok" },
    { "id": "no-real-screenshots", "severity": "low", "title": "Alt metinli gerçek ekran görüntüsü yok" }
  ]
}
```
