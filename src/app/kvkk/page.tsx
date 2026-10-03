import type { Metadata } from "next";
import Link from "next/link";
import { ControllerCard, LegalPage, Section } from "@/components/legal/legal-page";
import { APP_NAME } from "@/lib/config";
import { LEGAL, SUBPROCESSORS } from "@/lib/legal";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni",
  description: `${APP_NAME} kişisel verilerin korunması aydınlatma metni: hangi verilerin, hangi amaçla ve hangi hukuki sebeple işlendiği.`,
  alternates: { canonical: "/kvkk" },
};

// Structure follows the Aydınlatma Yükümlülüğü Tebliği: identity, purposes,
// legal bases (m.5/m.6, stated separately), recipients, collection method, rights (m.11).
export default function KvkkPage() {
  return (
    <LegalPage eyebrow="Kişisel verilerin korunması" title="KVKK Aydınlatma Metni" current="/kvkk">
      <p className="text-foreground">
        {APP_NAME}, pilates ve personal trainer eğitmenlerinin danışan, ders, paket ve ödeme kayıtlarını tuttuğu bir yazılımdır.
        Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca kişisel verilerinizin nasıl
        işlendiğini anlatır.
      </p>

      <div className="mt-6 rounded-2xl border p-4 text-sm">
        <p className="font-medium text-foreground">Kısaca</p>
        <ul className="mt-2 flex flex-col gap-1.5 [&_li]:ml-5 [&_li]:list-disc">
          <li>
            <strong className="font-medium text-foreground">Eğitmenseniz</strong>, hesabınıza ait verilerin veri sorumlusu
            biziz (<a href="#egitmenler">1. bölüm</a>).
          </li>
          <li>
            <strong className="font-medium text-foreground">Bir eğitmenin danışanıysanız</strong>, verilerinizin veri sorumlusu
            eğitmeninizdir; biz yalnızca onun adına ve talimatıyla işleriz (<a href="#danisanlar">2. bölüm</a>).
          </li>
          <li>Sağlık bilgileriniz yalnızca ayrıca açık rıza verirseniz işlenir.</li>
          <li>Verileriniz satılmaz, reklam için kullanılmaz; yalnızca zorunlu çerezler kullanılır.</li>
        </ul>
      </div>

      <Section title="Veri sorumlusu">
        <ControllerCard />
      </Section>

      <Section id="egitmenler" title="1. Eğitmenlerin kişisel verileri">
        <p>
          <strong>İşlenen veriler:</strong> ad soyad, e-posta, telefon; işletme adı, şehir, uzmanlık alanları, tanıtım yazısı,
          profil ve kapak fotoğrafı; IBAN ve hesap sahibi adı; paket, ders ve ödeme kayıtları; oturum ve güvenlik kayıtları (IP
          adresi, giriş zamanı, tarayıcı bilgisi).
        </p>
        <p>
          <strong>Amaçlar:</strong> hesabınızı açmak ve girişinizi doğrulamak; hizmeti sunmak (takvim, yoklama, paket ve ödeme
          takibi, herkese açık sayfanız); size hizmetle ilgili bildirimler göndermek; güvenliği sağlamak ve kötüye kullanımı
          önlemek; yasal yükümlülükleri yerine getirmek.
        </p>
        <p>
          <strong>Hukuki sebepler (KVKK m.5/2):</strong> sözleşmenin kurulması ve ifası için gerekli olması (c); veri
          sorumlusunun hukuki yükümlülüğü (ç); ilgili kişinin kendisi tarafından alenileştirilmiş olması, herkese açık sayfada
          yayımlamayı seçtiğiniz bilgiler için (d); temel hak ve özgürlüklerinize zarar vermemek kaydıyla meşru menfaatimiz,
          güvenlik kayıtları için (f).
        </p>
        <p>
          <strong>Toplama yöntemi:</strong> kayıt, profil ve ayar formları aracılığıyla sizden; oturum kayıtları ise hizmeti
          kullanırken otomatik yollarla elektronik ortamda toplanır.
        </p>
        <p>
          <strong>Bir stüdyonun ekibine davetle katılan eğitmenler:</strong> adınız, e-postanız, fotoğrafınız ve kısa
          tanıtımınız stüdyonun hesabında ve sayfasında görünür; verdiğiniz dersler ile stüdyonun belirlediği ücret kuralına
          göre hesaplanan hakediş bilgileriniz stüdyo sahibiyle paylaşılır. Bu bilgiler stüdyo adına işlenir; giriş ve oturum
          kayıtlarınızın veri sorumlusu biziz.
        </p>
      </Section>

      <Section id="danisanlar" title="2. Danışanların kişisel verileri">
        <p>
          Danışan verileri bakımından <strong>veri sorumlusu, danışanın kayıt olduğu ya da ders aldığı eğitmendir</strong>; birden
          fazla eğitmenin çalıştığı bir stüdyoda veri sorumlusu stüdyodur ve stüdyonun eğitmenleri verilerinizi stüdyo adına
          görür.{" "}
          {APP_NAME}, bu verileri eğitmen adına ve onun talimatları doğrultusunda işleyen <strong>veri işleyendir</strong>. Bu
          nedenle haklarınızla ilgili başvurularınızı öncelikle eğitmeninize yapabilirsiniz; bize ulaşan başvuruları eğitmeninize
          iletir, yerine getirmesi için destek oluruz.
        </p>
        <p>
          <strong>İşlenen veriler:</strong> ad soyad, telefon, e-posta; kayıt formunda eğitmenin sorduğu bilgiler (örneğin doğum
          tarihi, hedefler, uygun olduğunuz saatler); seçtiğiniz paket, ders ve katılım kayıtları; ödeme kayıtları ve
          yüklediğiniz dekontlar; eğitmeninizin sizinle ilgili notları ve size hazırladığı antrenman ve beslenme programları;
          kişisel sayfanızı son açtığınız zaman. <strong>Sağlık bilgileri ve vücut ölçümleri</strong> (boy, kilo, yağ oranı,
          sakatlık, hamilelik gibi) yalnızca ayrıca açık rıza verirseniz işlenir; ayrıntılar{" "}
          <Link href="/acik-riza">Açık Rıza Metni</Link>&apos;ndedir.
        </p>
        <p>
          <strong>Amaçlar:</strong> başvurunuzu eğitmeninizin değerlendirmesi; derslerinizin planlanması ve yürütülmesi; kalan ders
          ve ödeme durumunuzun takibi; randevu ve ödeme bildirimlerinin eğitmeninize iletilmesi; size ders ve ödeme hatırlatmaları
          gönderilmesi.
        </p>
        <p>
          <strong>Hukuki sebepler:</strong> eğitmeninizle aranızdaki ders hizmeti sözleşmesinin kurulması ve ifası (KVKK m.5/2-c)
          ile eğitmeninizin meşru menfaati (m.5/2-f). Sağlık bilgileri için hukuki sebep açık rızanızdır (m.6).
        </p>
        <p>
          <strong>Toplama yöntemi:</strong> eğitmenin sayfasındaki kayıt formu ve size özel link üzerinden sizden; ya da
          eğitmeninizin kendisinin girmesiyle, elektronik ortamda.
        </p>
      </Section>

      <Section id="iletisim" title="İletişim formu ve destek mesajları">
        <p>
          Sitedeki iletişim formuyla ya da uygulamadaki “Bize yazın” bölümünden bize yazdığınızda adınızı, e-posta adresinizi,
          varsa telefon numaranızı ve mesajınızı yalnızca size cevap vermek ve sorununuzu çözmek için işleriz. Hukuki sebep, talebinize
          cevap verilmesindeki meşru menfaatimizdir (m.5/2-f). Bu mesajları reklam ya da pazarlama için kullanmayız; silinmesini
          istediğinizde sileriz.
        </p>
      </Section>

      <Section id="aktarim" title="3. Verilerin aktarıldığı taraflar">
        <p>Verileriniz yalnızca hizmetin çalışması için gerekli altyapı sağlayıcılarıyla paylaşılır:</p>
        <ul>
          {SUBPROCESSORS.map((s) => (
            <li key={s.name}>
              <strong>{s.name}</strong>: {s.purpose}. Konum: {s.location}.
            </li>
          ))}
        </ul>
        <p>
          Bu sağlayıcıların sunucuları yurt dışında bulunduğundan, aktarım KVKK m.9 kapsamında Kişisel Verileri Koruma Kurulu&apos;nca
          ilan edilen <strong>standart sözleşmeler</strong> gibi uygun güvencelere dayanılarak yapılır. Ayrıca kanunen yetkili kamu
          kurum ve kuruluşlarına, talep hâlinde ve hukuki yükümlülük kapsamında aktarım yapılabilir. Verileriniz üçüncü kişilere
          satılmaz ve reklam amacıyla kullanılmaz.
        </p>
        <p>
          Eğitmenler danışanlarına WhatsApp üzerinden mesaj gönderdiğinde bu mesaj eğitmenin kendi WhatsApp hesabından gönderilir;{" "}
          {APP_NAME} yalnızca hazır bir mesaj metni oluşturur.
        </p>
      </Section>

      <Section id="saklama" title="4. Saklama süresi ve silme">
        <p>
          Eğitmen verileri hesap açık kaldığı sürece saklanır. Eğitmen bir danışanı kalıcı olarak sildiğinde o danışana ait
          paket, ders, ödeme, dekont ve form kayıtlarının tamamı silinir. Eğitmen hesabını <strong>Ayarlar &gt; Hesabımı
          sil</strong> adımıyla sildiğinde hesabı, danışanları ve tüm kayıtları hemen ve kalıcı olarak silinir; teknik yedeklerde
          kalan kopyalar da kısa süre içinde kendiliğinden silinir. Güvenlik kayıtları sınırlı bir süre tutulur.
        </p>
      </Section>

      <Section id="cerezler" title="5. Çerezler">
        <p>
          Yalnızca giriş yapmanızı ve oturumunuzun güvenle sürmesini sağlayan <strong>zorunlu çerezler</strong> kullanılır.
          Analiz, reklam ya da takip çerezi kullanılmaz; bu nedenle ayrıca çerez onayı istenmez. Tanıtım sayfalarında ve
          eğitmen sayfalarında kaç kişinin ziyaret ettiğini görmek için çerez kullanmayan, sizi tanımayan bir sayaç (Umami)
          çalışır. IP adresiniz saklanmaz, farklı günlerdeki ziyaretleriniz birbirine bağlanmaz. Bu sayaç uygulamanın içinde ve danışanların kişisel
          sayfalarında çalışmaz.
        </p>
      </Section>

      <Section id="haklar" title="6. Haklarınız">
        <p>KVKK m.11 uyarınca kişisel verilerinizle ilgili olarak:</p>
        <ul>
          <li>işlenip işlenmediğini öğrenme ve işlenmişse bilgi talep etme,</li>
          <li>işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
          <li>yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
          <li>eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
          <li>KVKK m.7 çerçevesinde silinmesini veya yok edilmesini isteme,</li>
          <li>düzeltme ve silme işlemlerinin verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,</li>
          <li>otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonuç çıkmasına itiraz etme,</li>
          <li>kanuna aykırı işleme nedeniyle zarara uğrarsanız zararın giderilmesini talep etme</li>
        </ul>
        <p>haklarına sahipsiniz.</p>
        <p>
          Başvurularınızı <strong>{LEGAL.email}</strong> adresine e-posta ile
          {LEGAL.address ? " ya da yukarıdaki adrese yazılı olarak" : ""} iletebilirsiniz. Danışansanız başvurunuzu eğitmeninize de yapabilirsiniz. Başvurular en geç 30 gün içinde ücretsiz
          olarak sonuçlandırılır.
        </p>
      </Section>
    </LegalPage>
  );
}
