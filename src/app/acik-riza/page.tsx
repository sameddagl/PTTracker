import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section } from "@/components/legal/legal-page";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Sağlık Verileri Açık Rıza Metni",
  description: `${APP_NAME} üzerinden eğitmeninizle paylaştığınız sağlık bilgileri için açık rıza metni.`,
  alternates: { canonical: "/acik-riza" },
};

// Kept apart from the notice on purpose: the Board requires explicit consent
// not to be bundled into the information text.
export default function HealthConsentPage() {
  return (
    <LegalPage eyebrow="Özel nitelikli kişisel veri" title="Sağlık Verileri Açık Rıza Metni" current="/acik-riza">
      <p className="text-foreground">
        Kayıt formundaki sağlık sorularını yanıtlamak isteğe bağlıdır. Yanıtlamak isterseniz formdaki onay kutusunu
        işaretleyerek aşağıdaki açık rızayı vermiş olursunuz.
      </p>

      <Section title="Neye rıza veriyorsunuz?">
        <p>
          Boy, kilo, sakatlık ve ameliyat geçmişi, kronik rahatsızlıklar, hamilelik gibi <strong>sağlık ve vücut ölçüsü
          bilgilerimin</strong>; derslerimin güvenli ve bana uygun planlanması amacıyla, kayıt olduğum eğitmen tarafından
          işlenmesine ve bu amaçla {APP_NAME} altyapısında saklanmasına açık rıza veriyorum.
        </p>
      </Section>

      <Section title="Bilmeniz gerekenler">
        <ul>
          <li>Rıza vermek zorunda değilsiniz. Vermezseniz kaydınız yine alınır; bu bilgileri eğitmeninize derste iletebilirsiniz.</li>
          <li>Bu bilgileri yalnızca eğitmeniniz görür. Başka eğitmenler ya da üçüncü kişiler göremez.</li>
          <li>Bilgiler yalnızca yukarıdaki amaçla kullanılır; reklam ya da pazarlama için kullanılmaz.</li>
          <li>
            Rızanızı dilediğiniz zaman geri alabilirsiniz. Eğitmeninize ya da <Link href="/kvkk#haklar">Aydınlatma Metni</Link>
            &apos;nde yazan adrese bildirmeniz yeterlidir; sağlık bilgileriniz silinir. Geri alma, o zamana kadar yapılan işlemeyi
            geçersiz kılmaz.
          </li>
          <li>
            Veri sorumlusu kayıt olduğunuz eğitmendir; ayrıntılar ve haklarınız için <Link href="/kvkk#danisanlar">Aydınlatma
            Metni</Link>&apos;ne bakın.
          </li>
        </ul>
      </Section>
    </LegalPage>
  );
}
