import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, ChevronRight, ClipboardList, ExternalLink, Globe, LogOut, Package, UsersRound } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { Avatar } from "@/components/avatar";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { getClaims, withTrainer } from "@/db";
import { getTrainer, listClients } from "@/db/queries";
import { siteUrl } from "@/lib/config";
import { signOut } from "../../giris/actions";
import { DeleteAccount } from "./delete-account";

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
    { href: "/takvim/grup", icon: UsersRound, title: "Grup dersleri", hint: "Kapasite ve sabit yerler" },
    {
      href: "/ayarlar/musaitlik",
      icon: CalendarClock,
      title: "Müsaitlik ve randevu",
      hint: trainer.bookingEnabled ? "Danışanlar randevu alabiliyor" : "Randevu kapalı",
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
            <p className="mt-1 text-xs text-muted-foreground">Geç iptal: dersten {trainer.lateCancelHours} saat öncesine kadar ücretsiz</p>
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

        <ul className="divide-y overflow-hidden surface">
          {rows.map(({ href, icon: Icon, title, hint }) => (
            <li key={href}>
              <Link href={href} className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/50">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted [&_svg]:size-[18px]">
                  <Icon aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{hint}</span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>

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
