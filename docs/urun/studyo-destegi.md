# Stüdyo desteği: birden fazla eğitmenli hesap

> Çalışma notu, 3 Ekim 2026. Henüz kod yok. İlk üç karar verildi (aşağıda "Verilen kararlar"); 0. aşamadan başlanabilir.

## Neden

Instagram'dan ulaşılan pilates stüdyolarının çoğu birden fazla eğitmenle çalışıyor. Bugünkü ürün tek kişilik: bir hesap = bir eğitmen. Stüdyo sahibi eğitmenlerini ekleyemediği için ürünü deneyemiyor bile.

Hedef büyük salonlar değil, **2–6 eğitmenli butik stüdyolar**: bir sahip (çoğu zaman kendisi de ders verir), birkaç eğitmen, reformer odası, özel ve grup dersleri. Turnike, üyelik kartı, muhasebe entegrasyonu gibi büyük salon özellikleri kapsam dışı.

Bağımsız eğitmen ürünü olduğu gibi kalır: tek kişilik hesap, "ekibi olmayan bir stüdyo" sayılır. Kimse geçiş yapmak zorunda kalmaz.

## Temel kararlar (önerilen)

| Konu | Öneri | Neden |
|---|---|---|
| Danışan kimin? | **Stüdyonun.** Eğitmen ayrılınca danışan stüdyoda kalır. | Stüdyo sahibinin beklentisi bu; paketi ve parayı stüdyo alıyor. |
| Paket ve fiyat | Stüdyo belirler. Paket istenirse belli bir eğitmene bağlanabilir (ör. "kıdemli eğitmenle özel ders"). | Tek fiyat listesi; farklı eğitmen fiyatı isteyen stüdyolar da var. |
| Ödeme | Stüdyonun IBAN'ına gelir, sahibi onaylar. | Para eğitmene değil stüdyoya akar. |
| Eğitmen ne görür? | Takvimi, kendi derslerini, derslerine gelen danışanları, yoklama ve ders notu. **Para, ciro ve fiyat ayarlarını görmez.** | Küçük stüdyoda takvim ortak; para sahibin işi. |
| Sağlık bilgisi | Eğitmen, ders verdiği danışanın sağlık uyarısını görür. | Ders güvenliği için gerekli. |
| Veri sorumlusu (KVKK) | Stüdyo. Eğitmenler stüdyo adına işler. | Danışan stüdyoya kayıt oluyor. |

## Roller

- **Sahip:** Her şey. Eğitmen davet eder, çıkarır; paket, fiyat, ödeme, ayarlar, raporlar.
- **Eğitmen:** Takvim (hepsini görür, kendi derslerini yönetir), yoklama, ders notu, kendi danışanlarına mesaj, program ve ölçüm.
- *(Sonra)* **Resepsiyon:** Ders planlar, ödeme girer, danışan ekler; program ve sağlık notu görmez.

Sahip aynı zamanda eğitmen olabilir (çoğu küçük stüdyoda öyle).

## Akışlar

### 1. Stüdyo hesabı açma
- Başlangıç ekranına bir soru: **"Tek başıma çalışıyorum" / "Stüdyom var, birlikte çalıştığım eğitmenler var"**.
- Stüdyo seçilirse stüdyo adı zorunlu, ardından "Eğitmenlerini davet et" adımı (atlanabilir).
- Tek kişilik hesap da istediği an **Ayarlar → Ekip**'ten eğitmen davet ederek stüdyoya döner. Veri taşıma yok.

### 2. Eğitmen davet etme
1. Sahip: Ayarlar → Ekip → **Eğitmen ekle**: ad soyad, e-posta, (isteğe bağlı) telefon ve takvim rengi.
2. Eğitmene davet e-postası gider: "X Stüdyo seni ekibine ekledi". Link `/davet/<token>`.
3. Eğitmen linke tıklar, mevcut giriş akışıyla (e-posta kodu) girer, kısa profilini tamamlar (fotoğraf, kısa tanıtım).
4. Sahip ekip listesinde "Katıldı" görür. Davet 7 gün geçerli, yeniden gönderilebilir, iptal edilebilir.
- Eğitmeni çıkarmak: erişimi kapanır, geçmiş dersleri ve notları stüdyoda kalır (adıyla). Gelecekteki dersleri başka eğitmene aktarma ekranı çıkar.

### 3. Takvim
- Her dersin bir **eğitmeni** olur. Ders planlarken "Eğitmen" seçimi (varsayılan: planlayan kişi).
- Takvimde eğitmen renkleri ve filtre: "Hepsi / Ben / Ayşe / Mert".
- Aynı eğitmene aynı saatte iki ders verilemez. *(Sonra)* Oda/reformer çakışması.
- Grup dersleri: sabit eğitmeni olur; tek seferlik "yerine Mert girecek" değişikliği yapılabilir, danışanlara bildirim gider.

### 4. Bugün ekranı
- Eğitmen: kendi bugünkü dersleri, yoklama, kendi danışanlarının uyarıları.
- Sahip: iki görünüm: **"Benim derslerim"** ve **"Stüdyo"** (bütün eğitmenler, bekleyen ödemeler, başvurular, paketi bitenler).

### 5. Yoklama ve ders notu
- Dersi veren eğitmen alır; sahip her dersin yoklamasını alabilir/düzeltebilir.
- Paket düşme, geç iptal ve telafi kuralları bugünküyle aynı (stüdyo ayarı).

### 6. Danışanlar
- Danışan stüdyoya aittir. Listede "Eğitmeni" sütunu: son 30 günde en çok ders aldığı eğitmen.
- Eğitmen danışan listesinde varsayılan olarak **kendi danışanlarını** görür, "Tümü"ne geçebilir (sahip bunu kapatabilir).

### 7. Paket ve ödeme
- Paketler stüdyonun. Pakette isteğe bağlı "Sadece şu eğitmen(ler)le" kısıtı.
- Ödemeler bugünkü gibi; bildirim ve onay sahipte.
- Eğitmen nakit aldığında "ödeme aldım" girebilir, sahip onaylar (ayar).

### 8. Eğitmen hakedişi
- Sahip her eğitmene bir **ücret kuralı** tanımlar (Ayarlar → Ekip → eğitmen):
  - **Ders başı sabit:** özel, düet ve grup dersi için ayrı tutar (ör. özel 600 TL, düet 750 TL, grup 900 TL).
  - **Yüzde:** dersin değerinin yüzdesi. Dersin değeri = danışanın paket fiyatı ÷ paketteki ders sayısı; grup dersinde gelen her danışanın değeri toplanır.
  - Sahibin kendisi için kural tanımlanmaz.
- Hangi dersler sayılır: **geldi** her zaman; **geç iptal** ve **gelmedi** için sahip seçer (stüdyo genelinde tek ayar, varsayılan: sayılmaz). Eğitmenin ya da stüdyonun iptal ettiği ders sayılmaz.
- Ay sonu **Hakediş** ekranı (yalnızca sahip): eğitmen başına ders listesi, ders türüne göre adetler, hesaplanan tutar, "Ödendi" işareti ve Excel indirme. Eğitmen kendi hakediş özetini görür (sadece kendi rakamı).
- Kural değişirse geçmiş aylar etkilenmez: hesaplanan ay "Kapatıldı" olunca tutar sabitlenir.

### 9. Danışanın sayfası
- Derslerde eğitmen adı ve fotoğrafı.
- Randevu alırken önce eğitmen seçimi ("Fark etmez" dahil), sonra o eğitmenin boş saatleri.
- Mesajlar: danışanın stüdyoyla tek yazışması; yazan eğitmenin adı görünür. Sahip ve danışanın eğitmenleri görür.

### 10. Stüdyonun herkese açık sayfası
- `/slug`: stüdyo bilgisi, **eğitmenler** (fotoğraf, kısa tanıtım), dersler, paketler, deneme dersi. Kayıt formu stüdyoya düşer.

### 11. Bildirimler
- Eğitmen: kendi derslerine iptal, "geliyorum", yeni randevu, kendi danışanlarından mesaj.
- Sahip: ödeme, başvuru, paket yenileme, haftalık özet (stüdyo geneli).

## Teknik yaklaşım

Bugün `trainers.id` = giriş yapan kullanıcı ve 31 tablonun hepsi `trainer_id` ile bu hesaba bağlı; RLS kuralı `trainer_id = auth.uid()`.

Plan: **`trainers` satırı "hesap/stüdyo" olarak kalır**, kullanıcılar bu hesaba üye olur.

- Yeni tablo `account_members (account_id → trainers.id, user_id → auth.users, role owner|instructor, full_name, photo, bio, color, active)`. Her mevcut hesaba sahip olarak bir satır eklenir (migration).
- Yeni tablo `account_invites (account_id, email, token_hash, role, expires_at, accepted_at)`.
- RLS kuralı `trainer_id = auth.uid()` yerine `trainer_id in (select my_accounts())` olur (`security definer` fonksiyon). Kolon adları değişmez, 31 tablodaki politika tek yerden (`ownRows`) güncellenir.
- `withTrainer()` giriş yapan kullanıcının hesabını üyelikten çözer, `(tx, accountId, member)` verir. Bugünkü 116 çağrı aynı kalır; para ve ayar işlemlerine `requireOwner(member)` kontrolü eklenir.
- `lessons.instructor_id`, `group_classes.instructor_id`, `availability_rules.instructor_id`, `package_templates.instructor_ids` (isteğe bağlı) eklenir; mevcut satırlar hesabın sahibiyle doldurulur.
- Bildirimler: `push_subscriptions` kullanıcıya (üyeye) bağlanır; `notifyTrainer` alıcıyı role ve derse göre seçer.
- Tek kişilik hesap = tek üyeli stüdyo; arayüzde ekip ögeleri sadece birden fazla üye olunca görünür.

Riskler: RLS değişikliği bütün veriye dokunur; `test:db` ve izolasyon testleri (bir stüdyonun eğitmeni başka stüdyoyu göremez, eğitmen ödemeleri göremez) bu aşamanın asıl işi.

## Aşamalar

**0. Altyapı (görünür değişiklik yok)**: üyelik tabloları, RLS, `withTrainer`, mevcut hesapların sahip olarak taşınması, izolasyon testleri.

**1. Stüdyo MVP**: davet, roller, derste eğitmen, takvim renk/filtre, eğitmen Bugün'ü, eğitmenin para görmemesi, danışan sayfasında eğitmen adı, eğitmen ücret kuralı ve aylık hakediş, stüdyo sayfasında eğitmenler.

**2. Randevu ve paket**: danışanın eğitmen seçerek randevu alması, eğitmen başına çalışma saatleri, pakete eğitmen kısıtı, grup dersinde yerine girme.

**3. Sonra**: resepsiyon rolü, oda/reformer planlama, bir eğitmenin birden fazla stüdyoda ya da hem kendi hesabında hem stüdyoda çalışması (hesap değiştirici), Ekip planı fiyatlandırması.

## Verilen kararlar (3 Ekim 2026)

1. **Danışan görünürlüğü:** Eğitmenin listesi varsayılan olarak kendi danışanları; "Tümü"ne geçebilir. Sahip bu geçişi kapatabilir.
2. **Hakediş:** İlk sürümde ücret hesabı da var (yukarıda 8. akış).
3. **Birden fazla stüdyo:** Sonraki aşamada. İlk sürümde bir kullanıcı tek hesaba bağlı; üyelik tablosu birden fazla hesaba izin verecek şekilde kurulur.

## Karar gereken konular

1. Fiyat: Ekip planı eğitmen başı mı, sabit stüdyo fiyatı mı? (Beta'da ücretsiz; karar ücretli döneme kadar beklenebilir.)
2. Yasal metinler: stüdyo hesabında veri sorumlusu stüdyo; kullanım koşulları ve aydınlatma metni buna göre güncellenmeli.
