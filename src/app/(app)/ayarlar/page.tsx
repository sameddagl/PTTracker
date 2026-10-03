import type { Metadata } from "next";
import Link from "next/link";
import { Bell, BellRing, CalendarClock, ChevronRight, CircleHelp, ClipboardList, Download, Dumbbell, ExternalLink, Globe, HandCoins, LifeBuoy, ListChecks, LogOut, Package, Ruler, TimerOff, UsersRound, Wallet, type LucideIcon } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { Avatar } from "@/components/avatar";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionTitle } from "@/components/page-header";
import { getClaims, withTrainer } from "@/db";
import { getTrainer, listClients } from "@/db/queries";
import { listMembers, myAccounts } from "@/db/team";
import { can } from "@/lib/permissions";
import { countUnreadSupport } from "@/db/support";
import { siteUrl } from "@/lib/config";
import { signOut } from "../../giris/actions";
import { AccountSwitch } from "./account-switch";
import { DeleteAccount } from "./delete-account";

export const metadata: Metadata = { title: "Ayarlar" };

export default async function SettingsPage() {
  const [{ trainer, clientCount, supportUnread, member, teamSize }, claims] = await Promise.all([
    withTrainer(async (tx, id, member) => ({
      trainer: await getTrainer(tx, id),
      member,
      clientCount: member.role === "owner" ? (await listClients(tx, id)).length : 0,
      supportUnread: member.role === "owner" ? await countUnreadSupport(tx, id) : 0,
      teamSize: (await listMembers(tx, id)).length,
    })),
    getClaims(),
  ]);
  const accounts = await myAccounts(member.userId);
  const accountSwitch = accounts.length > 1 && <AccountSwitch accounts={accounts} current={member.accountId} />;

  if (member.role === "instructor") {
    const studioName = trainer.businessName?.trim() || trainer.fullName;
    return (
      <>
        <PageHeader title="Ayarlar" />
        <div className="flex flex-col gap-6">
          <section aria-label="Hesap" className="flex items-center gap-4 surface p-5">
            <Avatar name={member.name || claims?.email || "?"} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold">{member.name || "—"}</p>
              <p className="truncate text-sm text-muted-foreground">
                {studioName} · {claims?.email ?? "—"}
              </p>
            </div>
          </section>
          {accountSwitch}
          <SettingsGroup id="me" title="Sen" rows={[
              { href: "/ayarlar/profil", icon: Globe, title: "Profilin", hint: "Adın, fotoğrafın ve kısa tanıtımın" },
              { href: "/hakedis", icon: Wallet, title: "Hakedişim", hint: "Bu ay verdiğin dersler ve tutar" },
              ...(can(member, "editAvailability")
                ? [{ href: "/ayarlar/musaitlik", icon: CalendarClock, title: "Çalışma saatlerim", hint: "Randevu alınabilen saatlerin ve izin günlerin" }]
                : []),
              { href: "/programlar", icon: Dumbbell, title: "Programlar", hint: "Antrenman ve beslenme şablonları, hareketler" },
              { href: "/ayarlar/bildirimler", icon: Bell, title: "Bildirimler", hint: "Bu cihazda bildirimleri aç" },
              { href: "/yardim", icon: CircleHelp, title: "Yardım", hint: "Yoklama, ders ve program adım adım" },
            ]} />
          <p className="text-sm text-muted-foreground">Ödemeler, paketler ve stüdyo ayarları {studioName} tarafından yönetiliyor.</p>
          <form action={signOut}>
            <SubmitButton variant="outline">
              <LogOut />
              Çıkış yap
            </SubmitButton>
          </form>
        </div>
      </>
    );
  }

  const pageUrl = trainer.publicPageEnabled && trainer.slug ? `${siteUrl()}/${trainer.slug}` : null;
  // One list per area, in the order a studio is set up and then run.
  const groups: { id: string; title: string; rows: Row[] }[] = [
    {
      id: "studio",
      title: "Stüdyo",
      rows: [
        {
          href: "/ayarlar/profil",
          icon: Globe,
          title: "Profil ve sayfan",
          hint: trainer.publicPageEnabled && trainer.slug ? `Yayında · /${trainer.slug}` : "Henüz yayında değil",
        },
        {
          href: "/ayarlar/ekip",
          icon: UsersRound,
          title: "Ekip",
          hint: teamSize > 1 ? `${teamSize - 1} eğitmen · yetkiler, renk, hakediş` : "Stüdyonda ders veren eğitmenleri ekle",
        },
        ...(teamSize > 1 ? [{ href: "/hakedis", icon: HandCoins, title: "Hakediş", hint: "Eğitmenlerin aylık dersleri ve tutarları" }] : []),
      ],
    },
    {
      id: "lessons",
      title: "Dersler ve randevu",
      rows: [
        { href: "/ayarlar/musaitlik", icon: CalendarClock, title: "Müsaitlik ve randevu", hint: trainer.bookingEnabled ? "Danışanlar randevu alabiliyor" : "Randevu kapalı" },
        { href: "/takvim/grup", icon: UsersRound, title: "Grup dersleri", hint: "Haftalık grup dersleri, kontenjan, sabit yer" },
        {
          href: "/ayarlar/iptal-kurali",
          icon: TimerOff,
          title: "Geç iptal kuralı",
          hint: trainer.lateCancelHours === 0 ? "Kural yok, iptal her zaman ücretsiz" : `Dersten ${trainer.lateCancelHours} saat öncesine kadar ücretsiz`,
        },
      ],
    },
    {
      id: "clients",
      title: "Paketler ve danışanlar",
      rows: [
        { href: "/paketler", icon: Package, title: "Paketler ve fiyatlar", hint: "Seans paketleri, indirimler, taksitler, deneme dersi" },
        { href: "/ayarlar/kayit-formu", icon: ClipboardList, title: "Kayıt formu", hint: "Kayıtta danışana sorulan sorular" },
        {
          href: "/ayarlar/mesajlar",
          icon: BellRing,
          title: "Hatırlatma ve mesajlar",
          hint: trainer.remindersEnabled ? `Hatırlatma dersten ${trainer.reminderHours} saat önce` : "Otomatik hatırlatma kapalı",
        },
        { href: "/ayarlar/olcumler", icon: Ruler, title: "Ölçümler", hint: "Formdaki ölçüler, danışanın kendi kilosu" },
      ],
    },
    {
      id: "programs",
      title: "Programlar",
      rows: [
        { href: "/programlar", icon: Dumbbell, title: "Program şablonları", hint: "Antrenman ve beslenme şablonları" },
        { href: "/programlar/hareketler", icon: ListChecks, title: "Hareketler", hint: "Hareket listesi, videolar, çalışan kaslar" },
      ],
    },
    {
      id: "account",
      title: "Uygulama ve hesap",
      rows: [
        { href: "/ayarlar/bildirimler", icon: Bell, title: "Bildirimler", hint: "Hangi bildirim ve e-postaları alacağını seç" },
        { href: "/yardim", icon: CircleHelp, title: "Yardım", hint: "Paket, yoklama, ödeme ve diğer konular adım adım" },
        {
          href: "/ayarlar/destek",
          icon: LifeBuoy,
          title: "Bize yazın",
          hint: supportUnread > 0 ? `${supportUnread} yeni cevap` : "Soru, öneri, takıldığın bir yer",
          badge: supportUnread,
        },
        { href: "/ayarlar/disa-aktar", icon: Download, title: "Verilerini indir", hint: "Excel: danışanlar, paketler, dersler, ödemeler", download: true },
      ],
    },
  ];

  return (
    <>
      <PageHeader title="Ayarlar" />
      <div className="flex flex-col gap-6">
        <section aria-label="Hesap" className="flex items-center gap-4 surface p-5">
          <Avatar name={trainer.fullName || claims?.email || "?"} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold">{trainer.businessName?.trim() || trainer.fullName || "—"}</p>
            <p className="truncate text-sm text-muted-foreground">
              {trainer.businessName?.trim() ? `${trainer.fullName} · ` : ""}
              {claims?.email ?? "—"}
            </p>
          </div>
        </section>

        {accountSwitch}

        {pageUrl && (
          <section aria-label="Sayfan" className="flex items-center gap-3 surface py-2 pr-2 pl-4">
            <span className="size-2 shrink-0 rounded-full bg-success" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted-foreground">Sayfan yayında</span>
              <span className="block truncate text-sm font-medium">{pageUrl.replace(/^https?:\/\//, "")}</span>
            </span>
            <CopyButton text={pageUrl} label="" size="icon" variant="ghost" aria-label="Linki kopyala" />
            <Button asChild size="icon" variant="ghost">
              <a href={pageUrl} target="_blank" rel="noopener noreferrer" aria-label="Sayfanı aç">
                <ExternalLink />
              </a>
            </Button>
          </section>
        )}

        {groups.map((g) => (
          <SettingsGroup key={g.id} id={g.id} title={g.title} rows={g.rows} />
        ))}

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

type Row = { href: string; icon: LucideIcon; title: string; hint: string; badge?: number; download?: boolean };

function SettingsGroup({ id, title, rows }: { id: string; title: string; rows: Row[] }) {
  return (
    <section aria-labelledby={`${id}-heading`}>
      <SectionTitle id={`${id}-heading`}>{title}</SectionTitle>
      <ul className="divide-y overflow-hidden surface">
        {rows.map(({ href, icon: Icon, title, hint, badge, download }) => {
          const inner = (
            <>
              <RowIcon>
                <Icon aria-hidden />
              </RowIcon>
              <RowText title={title} hint={hint} />
              {!!badge && (
                <span className="min-w-6 rounded-full bg-lime px-1.5 text-center text-xs leading-6 font-semibold text-lime-foreground tabular-nums">{badge}</span>
              )}
              {!download && <ChevronRight className="size-4 text-muted-foreground" aria-hidden />}
            </>
          );
          const cls = "flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/50";
          return (
            <li key={href}>
              {download ? (
                // A plain link, so the browser downloads the file instead of routing to it.
                <a href={href} download className={cls}>
                  {inner}
                </a>
              ) : (
                <Link href={href} className={cls}>
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
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
