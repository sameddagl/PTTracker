import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section } from "@/components/legal/legal-page";
import { APP_NAME } from "@/lib/config";
import { LEGAL, SUBPROCESSORS } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description: `${APP_NAME} eğitmen hesabı kullanım koşulları ve danışan verilerinin işlenmesine ilişkin hükümler.`,
  alternates: { canonical: "/kosullar" },
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Eğitmen hesabı" title="Kullanım Koşulları" current="/kosullar">
      <p className="text-foreground">
        Bu koşullar, {APP_NAME}&apos;u kullanan eğitmenlerle {LEGAL.controller} arasındaki ilişkiyi düzenler. Hesap açarak bu
        koşulları kabul etmiş olursunuz.
      </p>

      <Section title="1. Hizmet">
        <p>
          {APP_NAME}; danışan, ders, paket, randevu ve ödeme kayıtlarınızı tutmanızı, herkese açık bir sayfa yayımlamanızı ve
          danışanlarınıza kişisel link göndermenizi sağlayan bir yazılımdır. Hizmet şu an <strong>beta</strong> aşamasındadır ve
          ücretsizdir. Beta süresince özellikler değişebilir, geçici kesintiler yaşanabilir. Ücretli bir plana geçilecekse bu, en
          az bir hafta önceden bildirilir; ücretli plana geçmek sizin tercihinizdir.
        </p>
      </Section>

      <Section title="2. Hesabınız">
        <ul>
          <li>Hesabınıza e-postanıza gönderilen kodla girilir; e-posta hesabınızın güvenliğinden siz sorumlusunuz.</li>
          <li>Hesabınızda girdiğiniz bilgilerin doğruluğu ve yayımladığınız içerik (fotoğraf, tanıtım, fiyatlar) size aittir.</li>
          <li>Hizmeti hukuka aykırı amaçlarla ya da başkalarının haklarını ihlal edecek şekilde kullanamazsınız.</li>
        </ul>
      </Section>

      <Section title="3. Danışan verileri ve sorumluluklarınız">
        <p>
          Danışanlarınıza ait veriler bakımından <strong>veri sorumlusu sizsiniz</strong>; {APP_NAME} bu verileri sizin adınıza
          ve talimatlarınız doğrultusunda işleyen <strong>veri işleyendir</strong>. Bu kapsamda:
        </p>
        <ul>
          <li>
            Danışanlarınızı KVKK uyarınca bilgilendirmek sizin yükümlülüğünüzdür. Sayfanız üzerinden kayıt olan danışanlara{" "}
            <Link href="/kvkk#danisanlar">Aydınlatma Metni</Link> gösterilir; danışanı elle eklediğinizde bilgilendirmeyi siz
            yaparsınız.
          </li>
          <li>
            Sağlık bilgilerini ancak danışanın açık rızasıyla girebilirsiniz. Danışan rızasını geri alırsa bu bilgileri silmeniz
            gerekir.
          </li>
          <li>Danışanlarınızdan gelen erişim, düzeltme ve silme taleplerini karşılamak için uygulamadaki araçları kullanırsınız.</li>
        </ul>
        <p>{APP_NAME} ise:</p>
        <ul>
          <li>Danışan verilerini yalnızca hizmeti sunmak için işler; satmaz, reklam için kullanmaz, başka eğitmenlere göstermez.</li>
          <li>Verileri uygun teknik ve idari tedbirlerle korur; her eğitmen yalnızca kendi kayıtlarına erişebilir.</li>
          <li>Verileri yalnızca aşağıdaki altyapı sağlayıcılarıyla paylaşır ve bir değişiklik olursa sizi bilgilendirir.</li>
          <li>Bir veri ihlalini öğrendiğinde sizi gecikmeksizin haberdar eder.</li>
          <li>Hesabınızı sildiğinizde danışan verilerini de kalıcı olarak siler.</li>
        </ul>
        <ul>
          {SUBPROCESSORS.map((s) => (
            <li key={s.name}>
              <strong>{s.name}</strong>: {s.purpose} ({s.location})
            </li>
          ))}
        </ul>
      </Section>

      <Section title="4. Ödemeler">
        <p>
          Danışanlarınızın ödemeleri doğrudan sizin hesabınıza yapılır; {APP_NAME} ödemelere aracılık etmez, komisyon almaz ve
          danışanlarınızla aranızdaki ticari ilişkinin tarafı değildir. Fiyatlandırma, fatura ve iade yükümlülükleri size aittir.
        </p>
      </Section>

      <Section title="5. Sorumluluğun sınırı">
        <p>
          Hizmet &quot;olduğu gibi&quot; sunulur. Makul özeni göstermekle birlikte kesintisiz ve hatasız çalışacağını garanti
          etmeyiz. Önemli kayıtlarınızın ayrıca bir kopyasını tutmanızı öneririz. Kanunen sınırlanamayan hâller saklıdır.
        </p>
      </Section>

      <Section title="6. Hesabın kapatılması ve değişiklikler">
        <p>
          Hesabınızı dilediğiniz zaman <strong>Ayarlar &gt; Hesabımı sil</strong> adımıyla silebilirsiniz; hesabınız ve
          danışanlarınıza ait tüm kayıtlar kalıcı olarak silinir. Bu koşulları ağır biçimde ihlal eden hesaplar kapatılabilir. Koşullarda
          önemli bir değişiklik olduğunda e-postayla bildirim yapılır. Bu koşullara Türk hukuku uygulanır.
        </p>
        <p>
          Sorularınız için: <strong>{LEGAL.email}</strong>
        </p>
      </Section>
    </LegalPage>
  );
}
