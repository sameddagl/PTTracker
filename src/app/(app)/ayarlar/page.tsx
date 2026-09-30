import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CalendarPlus, ChevronRight, CircleHelp, ClipboardList, Download, ExternalLink, Globe, LogOut, Package, TimerOff, UsersRound } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { Avatar } from "@/components/avatar";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionTitle } from "@/components/page-header";
import { ActionTiles } from "@/components/action-tiles";
import { PushToggle } from "@/components/push-toggle";
import { getClaims, withTrainer } from "@/db";
import { getTrainer, listClients } from "@/db/queries";
import { siteUrl } from "@/lib/config";
import { signOut } from "../../giris/actions";
import { DeleteAccount } from "./delete-account";
import { subscribeTrainerAction, unsubscribeTrainerAction } from "./push-actions";

export const metadata: Metadata = { title: "Ayarlar" };

export default async function SettingsPage() {
  const [{ trainer, clientCount }, claims] = await Promise.all([
    withTrainer(async (tx, id) => ({ trainer: await getTrainer(tx, id), clientCount: (await listClients(tx, id)).length })),
    getClaims(),
  ]);

  const pageUrl = trainer.publicPageEnabled && trainer.slug ? `${siteUrl()}/${trainer.slug}` : null;
  const rows = [
    {
      href: "/ayarlar/profil",
      icon: Globe,
      title: "Profil ve sayfam",
      hint: trainer.publicPageEnabled && trainer.slug ? `Yayında · /${trainer.slug}` : "Henüz yayında değil",
    },
    { href: "/paketler", icon: Package, title: "Paketler", hint: "Fiyatlar, indirimler, taksitler" },
    {
      href: "/ayarlar/iptal-kurali",
      icon: TimerOff,
      title: "Geç iptal kuralı",
      hint: trainer.lateCancelHours === 0 ? "Kural yok, iptal her zaman ücretsiz" : `Dersten ${trainer.lateCancelHours} saat öncesine kadar ücretsiz`,
    },
    { href: "/ayarlar/kayit-formu", icon: ClipboardList, title: "Kayıt formu", hint: "Danışandan istenen bilgiler" },
  ];

  return (
    <>
      <PageHeader title="Ayarlar" />
      <div className="flex flex-col gap-6">
        <section aria-label="Hesap" className="flex items-center gap-4 surface p-5">
          <Avatar name={trainer.fullName || claims?.email || "?"} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold">{trainer.fullName || "—"}</p>
            <p className="truncate text-sm text-muted-foreground">{claims?.email ?? "—"}</p>
          </div>
        </section>

        {pageUrl && (
          <section aria-label="Sayfan" className="flex items-center gap-3 surface py-2 pr-2 pl-4">
            <span className="size-2 shrink-0 rounded-full bg-success" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted-foreground">Sayfan yayında</span>
              <span className="block truncate text-sm font-medium">{pageUrl.replace(/^https?:\/\//, "")}</span>
            </span>
            <CopyButton text={pageUrl} label="" size="icon" variant="ghost" aria-label="Linki kopyala" />
            <Button asChild size="icon" variant="ghost">
              <a href={pageUrl} target="_blank" rel="noopener noreferrer" aria-label="Sayfamı aç">
                <ExternalLink />
              </a>
            </Button>
          </section>
        )}

        <ActionTiles
          items={[
            { href: "/ders/yeni?next=/ayarlar", icon: <CalendarPlus />, title: "Ders planla", primary: true },
            { href: "/takvim/grup", icon: <UsersRound />, title: "Grup dersleri" },
            { href: "/ayarlar/musaitlik", icon: <CalendarClock />, title: "Müsaitlik ve randevu" },
          ]}
        />

        <section aria-labelledby="studio-heading">
          <SectionTitle id="studio-heading">Stüdyon</SectionTitle>
          <ul className="divide-y overflow-hidden surface">
            {rows.map(({ href, icon: Icon, title, hint }) => (
              <li key={href}>
                <Link href={href} className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/50">
                  <RowIcon>
                    <Icon aria-hidden />
                  </RowIcon>
                  <RowText title={title} hint={hint} />
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="account-heading" className="flex flex-col gap-3">
          <SectionTitle id="account-heading">Uygulama ve hesap</SectionTitle>
          <PushToggle
            subscribe={subscribeTrainerAction}
            unsubscribe={unsubscribeTrainerAction}
            description="Yeni başvuru, randevu, iptal, ödeme, mesaj ve haftalık özet bu cihaza gelsin."
          />
          <ul className="divide-y overflow-hidden surface">
            <li>
              <Link href="/yardim" className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/50">
                <RowIcon>
                  <CircleHelp aria-hidden />
                </RowIcon>
                <RowText title="Yardım" hint="Paket, yoklama, ödeme ve diğer akışlar adım adım" />
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            </li>
            <li>
              {/* A plain link, so the browser downloads the file instead of routing to it. */}
              <a href="/ayarlar/disa-aktar" download className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/50">
                <RowIcon>
                  <Download aria-hidden />
                </RowIcon>
                <RowText title="Verilerini dışa aktar" hint="Excel: danışanlar, paketler, dersler, ödemeler" />
              </a>
            </li>
          </ul>
        </section>

        <form action={signOut}>
          <SubmitButton variant="outline">
            <LogOut />
            Çıkış yap
          </SubmitButton>
        </form>

        <div className="mt-6 border-t pt-6">
          <DeleteAccount trainerId={trainer.id} clientCount={clientCount} />
        </div>
      </div>
    </>
  );
}

function RowIcon({ children }: { children: React.ReactNode }) {
  return <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted [&_svg]:size-[18px]">{children}</span>;
}

function RowText({ title, hint }: { title: string; hint: string }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block font-medium">{title}</span>
      <span className="block truncate text-xs text-muted-foreground">{hint}</span>
    </span>
  );
}
