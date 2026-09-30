import Link from "next/link";
import { ArrowRight, Check, CircleHelp, PartyPopper } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Guide, GuideStepId } from "@/lib/guide";
import { cn } from "@/lib/utils";
import { BioLinkAddedButton, GuideVisibilityButton } from "./guide-buttons";

const STEPS: Record<GuideStepId, { title: string; why: string; href: string; cta: string }> = {
  profile: {
    title: "Profilini ve sayfanı yayınla",
    why: "Danışanların paketlerine bu sayfadan bakıp kayıt olur.",
    href: "/ayarlar/profil",
    cta: "Sayfanı hazırla",
  },
  package: {
    title: "İlk paketini oluştur",
    why: "8 ya da 12 derslik paketlerini bir kez gir; satarken listeden seçersin.",
    href: "/paketler/yeni",
    cta: "Paket ekle",
  },
  availability: {
    title: "Çalışma saatlerini gir",
    why: "Danışanların boş saatlerine kendileri randevu alsın. Online randevu kullanmayacaksan bu adımı geç.",
    href: "/ayarlar/musaitlik",
    cta: "Saatleri gir",
  },
  intake: {
    title: "Kayıt formunu gözden geçir",
    why: "Sayfandan kayıt olan danışanlara bu soruları sorarsın. Hazır sorular ekli, istediğini değiştir.",
    href: "/ayarlar/kayit-formu",
    cta: "Formu aç",
  },
  client: {
    title: "İlk danışanını ekle",
    why: "Şu anki danışanlarını ekle; paket, ders ve ödemelerini buradan takip et.",
    href: "/danisanlar/yeni",
    cta: "Danışan ekle",
  },
  lesson: {
    title: "İlk dersini planla",
    why: "Her hafta tekrar eden dersleri bir kez gir; yoklamayı bu sayfadan tek dokunuşla al.",
    href: "/ders/yeni?next=/bugun",
    cta: "Ders planla",
  },
  app: {
    title: "Uygulamayı telefonuna ekle, bildirimleri aç",
    why: "Ana ekrandan tek dokunuşla aç; yeni başvuru, randevu, iptal ve mesajlardan anında haberin olsun.",
    href: "/ayarlar/bildirimler",
    cta: "Nasıl yapılır?",
  },
  bio: {
    title: "Sayfanın linkini Instagram bio'na koy",
    why: "Takipçilerin linke dokunup paket seçer ve başvurur; başvurular buraya düşer.",
    href: "/ayarlar/profil",
    cta: "Sayfanı hazırla",
  },
};

/** The getting-started checklist at the top of Bugün. */
export function GettingStarted({ guide, pageUrl }: { guide: Guide; pageUrl: string | null }) {
  const nextId = guide.steps.find((s) => !s.done && !s.optional)?.id;
  const percent = Math.round((guide.done / guide.total) * 100);

  return (
    <section aria-labelledby="guide-heading" className="mb-8 overflow-hidden surface">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="guide-heading" className="text-xl font-semibold tracking-tight">
              Başlangıç rehberi
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Bu adımları bir kez yapman yeterli.</p>
          </div>
          <p className="shrink-0 text-2xl font-semibold tracking-tight tabular-nums" aria-hidden>
            {guide.done}/{guide.total}
          </p>
        </div>
        <div
          role="progressbar"
          aria-label="Rehber ilerlemesi"
          aria-valuemin={0}
          aria-valuemax={guide.total}
          aria-valuenow={guide.done}
          aria-valuetext={`${guide.total} adımdan ${guide.done} tanesi tamam`}
          className="h-2 overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full rounded-full bg-foreground transition-[width]" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <ol className="divide-y border-t">
        {guide.steps.map((step) => {
          const s = STEPS[step.id];
          const isNext = step.id === nextId;
          const needsPage = step.id === "bio" && !pageUrl;
          return (
            <li key={step.id} className={cn("flex gap-3 px-5 py-4", isNext && "bg-muted/40")}>
              <span
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                  step.done ? "border-success bg-success text-background" : "border-border",
                )}
                aria-hidden
              >
                {step.done && <Check className="size-3.5" strokeWidth={3} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {step.done ? (
                    <Link href={s.href} className="font-medium text-muted-foreground hover:text-foreground hover:underline">
                      {s.title}
                    </Link>
                  ) : (
                    <span className="font-medium">{s.title}</span>
                  )}
                  <span className="sr-only">{step.done ? "(tamamlandı)" : "(yapılacak)"}</span>
                  {isNext && <Badge variant="lime">Sıradaki</Badge>}
                  {step.optional && !step.done && <Badge variant="secondary">İsteğe bağlı</Badge>}
                </p>
                {!step.done && (
                  <>
                    <p className="mt-1 text-sm text-muted-foreground">{needsPage ? "Önce sayfanı yayınla, sonra linkini buradan kopyala." : s.why}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {step.id === "bio" && pageUrl ? (
                        <>
                          <CopyButton text={pageUrl} size="sm" variant="outline" />
                          <BioLinkAddedButton size="sm">
                            <Check />
                            Ekledim
                          </BioLinkAddedButton>
                        </>
                      ) : (
                        <Button asChild size="sm" variant={isNext ? "default" : "outline"}>
                          <Link href={s.href}>
                            {s.cta}
                            <ArrowRight />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/yardim">
            <CircleHelp />
            Nasıl çalışır?
          </Link>
        </Button>
        <GuideVisibilityButton variant="ghost" size="sm" className="text-muted-foreground">
          Rehberi gizle
        </GuideVisibilityButton>
      </div>
    </section>
  );
}

/** Shown once every step is done, until the trainer closes it. */
export function GuideComplete() {
  return (
    <section aria-labelledby="guide-done-heading" className="mb-8 flex flex-col gap-4 surface p-5 sm:flex-row sm:items-center">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-lime text-lime-foreground [&_svg]:size-6" aria-hidden>
        <PartyPopper />
      </span>
      <div className="min-w-0 flex-1">
        <h2 id="guide-done-heading" className="text-base font-semibold">
          Hazırsın!
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Başlangıç adımlarının hepsi tamam. Takıldığın bir yer olursa Ayarlar&apos;daki Yardım sayfasına bak.
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/yardim">Yardım</Link>
        </Button>
        <GuideVisibilityButton size="sm">Tamam</GuideVisibilityButton>
      </div>
    </section>
  );
}
