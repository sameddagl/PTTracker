# Danışan notları, ölçümler, antrenman ve beslenme programları

> Çalışma notu, 1 Ekim 2026. Henüz kod yok; aşağıdaki "Karar gereken konular" netleşince 1. aşamadan başlanır.

## Neden

Paket, ders ve ödeme takibi eğitmenin işini kolaylaştırıyor ama danışan için "kendi sayfam" çoğu zaman sadece kalan ders sayısı. Ölçümler ve program danışana her hafta açması için bir sebep verir. Danışan ilerlemesini gördükçe paketini yeniler. PT'ler şu an bu işleri Excel, WhatsApp'tan atılan PDF'ler ve not defteriyle yapıyor; tek yerde toplamak en güçlü satış cümlesi olur.

Hedef kitle ayrımı:
- **Pilates eğitmeni:** Ders notu ve duruş/sağlık uyarısı önemli. Ölçüm ikinci planda (kilo yerine esneklik, duruş, ağrı skoru). Program az kullanılır.
- **Personal trainer:** Ölçüm, antrenman programı ve beslenme ana iş. Rakiplerle (yabancı PT uygulamaları) karşılaştırılan yer burası.

## Mevcut durum (kodda olanlar)

- `clients.notes` (genel not), `clients.goals` (hedef), `clients.health_notes` (sağlık notu, KVKK özel nitelikli veri, sadece açık rızayla).
- `lesson_attendees.note`: yoklamada ders bazında not alanı var ama arayüzde öne çıkmıyor.
- `consents` tablosunda `health_data` rızası. Kayıt formundan gelen danışanda form sırasında alınıyor; eğitmenin elle eklediği danışanda eğitmen "açık rızasını aldım" diye işaretliyor.
- Danışan sayfası (`/p/<token>`) tek uzun sayfa; bölümler: paketler, dersler, ödemeler, mesajlar, bildirim ayarları.

## KVKK ve yasal sınırlar

- **Ölçümler sağlık verisidir** (kilo, yağ oranı, çevre ölçüleri, ağrı). Mevcut `health_data` rızası olmadan kaydedilmemeli. Rızası olmayan danışanda "Ölçüm ekle" yerine **"Danışandan onay iste"** çıkar. Danışan kendi sayfasında onay kutusunu görür ve onaylar; onaydan sonra ölçüm alanları açılır. Eğitmenin "rızasını aldım" diye işaretlemesi de mevcut akıştaki gibi kalır.
- **İlerleme fotoğrafları** en hassas veri (sağlık ve görüntü bir arada). İlk aşamalarda yok.
- **Beslenme:** Türkiye'de kişiye özel diyet listesi hazırlamak diyetisyenlerin alanı; PT'nin yaptığı çoğunlukla "beslenme önerisi". Ürünün dili buna göre olmalı: "diyet listesi" değil **"beslenme planı / önerisi"**. Sayfada kısa bir uyarı ("Bu plan tıbbi diyet tedavisi değildir; sağlık sorunun varsa diyetisyene danış") ve diyetisyenin hazırladığı PDF'i ekleme seçeneği olmalı. Kesin sınırı bir hukukçuya sormakta fayda var.
- Excel'e aktarma, hesap silme ve danışan silme bu verileri de kapsamalı. Aydınlatma metnine ölçüm ve program verisi eklenmeli.

## Özellikler ve akışlar

### 1. Danışan notları

**Ne:**
- **Uyarı notu (sabit):** Kısa, her yerde görünen not. Örneğin "Bel fıtığı, öne eğilme yok" ya da "Sağ diz ameliyatlı". Sağlık bilgisi içerdiği için `health_notes` alanını kullanır.
- **Not akışı:** Tarihli notlar listesi. Genel not ya da bir derse bağlı not. Yoklamada "Geldi"den sonra **"Not ekle"** ile o derse not düşülür ("Spring 2 kırmızıya geçtik, plank 45 sn").
- **Görünürlük:** Notlar varsayılan olarak sadece eğitmene açık. Her notta **"Danışan görsün"** seçeneği var; işaretliyse danışanın sayfasında "Eğitmeninin notları" altında çıkar.

**Akış:**
1. Yoklama veya ders sayfası → danışan satırında "Not" → kısa metin → kaydet.
2. Danışan sayfası (eğitmen) → **Notlar** sekmesi → tarih sırasıyla bütün notlar, ders notları ders tarihiyle.
3. Bugün, Yoklama ve ders ekranında uyarı notu olan danışanın adının yanında ⚠ işareti; dokununca not açılır.

### 2. Ölçümler

**Ne:**
- **Hazır ölçüler:** kilo, boy, yağ oranı, kas kütlesi, bel, kalça, göğüs, kol, bacak, dinlenik nabız.
- **Pilates için:** esneklik (otur-uzan, cm), ağrı skoru (0–10), duruş notu.
- **Kendi ölçüleri:** Eğitmen kendi ölçü türlerini ekleyebilir (ad + birim). Örneğin "plank süresi (sn)", "squat 1RM (kg)".
- **Ölçü seti:** Eğitmen hangi ölçüleri kullandığını bir kez seçer, "Ölçüm ekle" formunda sadece onlar çıkar. Varsayılan set branşa göre: PT'ye kilo/yağ/bel/kalça, pilatese esneklik/ağrı.
- **Periyot:** Danışan bazında "her 4 haftada bir ölçüm" gibi bir sıklık. Zamanı gelince eğitmenin Bugün ekranında **"Ölçüm zamanı gelenler"** listesi çıkar, danışana da (bildirimi açıksa) "Bu hafta ölçüm günü" bildirimi gider.
- **Grafik ve değişim:** Her ölçü için çizgi grafik ve "ilk ölçümden bu yana −3,2 kg, 8 hafta" özeti.
- **Danışan görür:** Danışanın sayfasında **"İlerlemem"** bölümü: son ölçüm, değişim, grafik. Eğitmen isterse kapatabilir.
- **Danışan kendisi girer (isteğe bağlı):** Eğitmen açarsa danışan sayfasından kilosunu girebilir. Girilen değer "danışan girdi" diye işaretlenir.

**Akış:**
1. Danışan sayfası → **Ölçümler** sekmesi → "Ölçüm ekle". Tarih bugün gelir; setteki alanlar boş gelir, son değer gri ipucu olarak yazar. Kaydedince grafik güncellenir.
2. Rızası olmayan danışanda bu sekmede "Danışandan onay iste" butonu ve WhatsApp/mesaj ile gönderilecek hazır metin olur.
3. Ders sırasında hızlı giriş: ders sayfasında danışan satırından "Ölçüm" (sadece kilo ve bir iki alan).

### 3. Antrenman programı

**Ne:**
- **Hareket kütüphanesi:** Eğitmenin kendi hareketleri: ad, kategori (bacak, sırt, core, reformer…), isteğe bağlı video linki (YouTube/Instagram) ve not. İlk açılışta Türkçe hazır liste gelir: yaklaşık 80 temel salon ve reformer hareketi. Eğitmen düzenleyebilir ya da silebilir.
- **Program:** Günlerden oluşur (Gün A / Gün B ya da Pazartesi / Çarşamba). Her günde hareketler ve her harekette set × tekrar, ağırlık ya da süre, dinlenme ve not. Pilates için tekrar, yay ayarı (spring) ve not yeterli.
- **Şablon:** Program bir kez hazırlanır ("Başlangıç tüm vücut 3 gün"), danışana atanırken kopyalanır ve kişiye göre düzenlenir. Şablonu değiştirmek atanmış programları bozmaz.
- **Süre ve geçmiş:** Programın başlangıç ve isteğe bağlı bitiş tarihi olur. Yeni program atanınca eskisi geçmişe geçer, silinmez.
- **Danışan görür:** Danışanın sayfasında **"Programım"**: bugünün günü öne çıkar, hareketler sırayla listelenir, video linki açılır. Her günün sonunda **"Bugünkü antrenmanı yaptım"** butonu var; eğitmen kimin programa uyduğunu görür.
- **Sonraki aşama:** Set set kg ve tekrar kaydı (antrenman günlüğü). Danışan "3×10, 40 kg" girer, grafikte güç artışı görünür. İlk sürümde yok; önce programın gerçekten kullanıldığı görülmeli.

**Akış:**
1. Yeni **Programlar** sayfası (Paketler'in yanında, Ayarlar içinden ya da Danışanlar'dan ulaşılır): şablon listesi, "Yeni program".
2. Program düzenleyici: gün ekle → hareket ara ve ekle (kütüphaneden, yoksa yazınca yenisi oluşur) → set/tekrar alanları → sıralama.
3. Danışan sayfası → **Program** sekmesi → "Program ver" → şablon seç ya da boş başla → düzenle → **"Danışana gönder"**. Danışana "Yeni programın hazır" bildirimi ve mesaj gider.
4. Danışan sayfasında Programım → gün seç → hareketler → "Yaptım".

### 4. Beslenme planı

**Ne:**
- **Plan:** Öğünlere bölünmüş serbest metin: kahvaltı, ara öğün, öğle, akşam. Her öğünde birkaç satır öneri. Kalori hesabı ya da besin veritabanı yok; Türkçe besin veritabanı büyük bir iş ve yasal sınırı zorlar.
- **Günlük hedefler (isteğe bağlı):** Su (litre), protein (g), adım sayısı.
- **PDF ekleme:** Diyetisyenden gelen planı yüklemek için.
- **Uyarı:** "Bu plan tıbbi diyet tedavisi değildir…" satırı her planda sabit.
- **Danışan görür:** Danışanın sayfasında **"Beslenme"** bölümü.
- **Sonraki aşama:** Danışanın günlük kısa kontrolü ("Bugün plana uydum / su hedefimi tuttum"). Eğitmen haftalık uyum oranını görür.

**Akış:**
- Danışan sayfası → **Beslenme** sekmesi → "Plan oluştur" (şablondan ya da boş) → öğünleri yaz → gönder.
- Antrenman programıyla aynı şablon mantığı: Programlar sayfasında "Beslenme şablonları".

## Ekran düzeni

- **Eğitmen tarafı:** Danışan sayfası uzadığı için sekmelere bölünür: **Genel** (paketler, dersler, ödemeler; bugünkü sayfa) · **Notlar** · **Ölçümler** · **Program** · **Beslenme**. Telefonda yatay kaydırılan sekme çubuğu olur. Eğitmen kullanmadığı sekmeleri gizleyebilir (pilatesçi Beslenme'yi kapatır).
- **Danışan sayfası:** Tek uzun sayfa artık taşınamaz. Altta sekme çubuğu olur: **Derslerim** · **Programım** · **İlerlemem** · **Mesajlar**. Eğitmen program ya da ölçüm kullanmıyorsa o sekme hiç çıkmaz. "Geliyor musun?" kutusu her sekmede en üstte kalır.
- **Bugün ekranında yeni listeler:** "Ölçüm zamanı gelenler" ve "Programı biten ya da 2 haftadır güncellenmeyenler".

## Veri modeli taslağı

| Tablo | Alanlar |
|---|---|
| `client_notes` | id, trainer_id, client_id, lesson_id (boş olabilir), body, visible_to_client, created_at |
| `measurement_types` | id, trainer_id (boşsa hazır tür), key, label, unit, decimals, sort_order, active |
| `measurements` | id, trainer_id, client_id, measured_on, type_id, value (numeric), entered_by (trainer/client), note |
| `exercises` | id, trainer_id, name, category, video_url, note, archived_at |
| `programs` | id, trainer_id, client_id (boşsa şablon), kind (workout/nutrition), name, starts_on, ends_on, template_id, sent_at, archived_at |
| `program_days` | id, program_id, title, sort_order |
| `program_items` | id, day_id, exercise_id, sets, reps, load, duration_sec, rest_sec, note, sort_order (beslenmede: öğün adı + metin) |
| `program_checkins` | id, program_id, day_id, client_id, done_on |

`clients` tablosuna eklenecekler: `measure_every_days`, `self_measure_enabled`. Hepsi `ownRows` RLS ile eğitmene kapalı; danışan tarafı mevcut portal yolu gibi `adminDb` ve çözülmüş token ile okur ve yazar.

## Aşamalar

| Aşama | Kapsam | Tahmini iş |
|---|---|---|
| **1. Notlar ve ölçümler** | Uyarı notu ve ⚠ işareti, not akışı, yoklamada "Not ekle", danışan görsün seçeneği; ölçü setleri, ölçüm ekleme, grafik ve değişim, danışan sayfasında İlerlemem, rıza akışı, Excel'e ekleme | ~1 hafta |
| **2. Antrenman programı** | Hareket kütüphanesi ve hazır liste, program düzenleyici, şablonlar, danışana atama ve bildirim, danışan sayfasında Programım ve "Yaptım", danışan sayfasının sekmelere bölünmesi | ~1,5–2 hafta |
| **3. Beslenme ve periyot** | Beslenme planı ve şablonu, PDF ekleme, günlük hedefler; periyodik ölçüm hatırlatması, danışanın kendi kilosunu girmesi | ~1 hafta |
| **Sonra** | Antrenman günlüğü (set set kg), günlük beslenme kontrolü, ilerleme fotoğrafları, programı PDF olarak indirme | Kullanıma göre |

Notlar ve ölçümler hem pilatesçiye hem PT'ye yarar ve en az işle en çok değeri verir; o yüzden önce o. Program ve beslenme PT'lerin geri bildirimine göre şekillenmeli.

**Fiyatlandırma notu:** Program ve beslenme ileride ücretli planın ayırıcı özelliği olabilir (örneğin "PT paketi"). Beta süresince herkese açık kalır.

## Karar gereken konular

1. **Ölçümleri danışan görsün mü?** Önerim: varsayılan açık, eğitmen kapatabilsin.
2. **Danışan kendi kilosunu girebilsin mi?** Önerim: 3. aşamada, eğitmen açarsa.
3. **Beslenme ne kadar yapılı olsun?** Önerim: öğünlere bölünmüş serbest metin, PDF ve uyarı satırı. Kalori ve besin veritabanı yok.
4. **Hareket kütüphanesi hazır gelsin mi?** Önerim: evet, video linksiz Türkçe isimlerle yaklaşık 80 hareket.
5. **Danışan sayfası sekmelere geçsin mi?** 2. aşamada gerekli; 1. aşamada İlerlemem bölümü mevcut tek sayfaya eklenebilir.
