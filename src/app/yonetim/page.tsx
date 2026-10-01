import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatTile } from "@/components/stat-tile";
import { adminDb, getClaims, type Tx } from "@/db";
import { activation, overview, trainerList, weekly } from "@/db/admin-metrics";
import { countUnreadForAdmin } from "@/db/support";
import { isAdminEmail } from "@/lib/admin";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Yönetim", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const fmtDate = (iso: string) => new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: "Europe/Istanbul" }).format(new Date(iso));
const weekLabel = (iso: string) => fmtDate(`${iso}T12:00:00Z`);

function ago(iso: string | null) {
  if (!iso) return "—";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days === 0 ? "bugün" : days === 1 ? "dün" : `${days} gün önce`;
}

export default async function AdminPage() {
  // Anyone who isn't the owner gets a plain 404, so the page's existence isn't advertised.
  const claims = await getClaims();
  if (!isAdminEmail(claims?.email as string | undefined)) notFound();

  // Sequential: one pooled connection is plenty for a page only the owner opens.
  const db = adminDb as unknown as Tx;
  const o = await overview(db);
  const a = await activation(db);
  const weeks = await weekly(db, 8);
  const trainers = await trainerList(db);
  const supportUnread = await countUnreadForAdmin(db);

  const funnel = [
    { label: "Kayıt oldu", n: a.signed_up },
    { label: "Başlangıcı bitirdi", n: a.onboarded },
    { label: "Paket oluşturdu", n: a.package },
    { label: "Danışan ekledi", n: a.client },
    { label: "Ders planladı", n: a.lesson },
    { label: "Yoklama aldı", n: a.attendance },
    { label: "Sayfasını yayınladı", n: a.page },
    { label: "Başvuru aldı", n: a.application },
    { label: "Bildirimleri açtı", n: a.push },
  ];
  const top = Math.max(a.signed_up, 1);
  const maxWeek = Math.max(1, ...weeks.map((w) => w.marked));

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-10 bg-canvas px-4 py-8 md:px-8">
      <header>
        <p className="eyebrow">Yalnızca sen görüyorsun</p>
        <h1 className="text-3xl font-semibold">Yönetim</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sayılar anlık. Danışanların adı ya da iletişim bilgisi bu sayfada yok.</p>
        <Link
          href="/yonetim/mesajlar"
          className={cn("mt-4 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium", supportUnread > 0 ? "bg-lime text-lime-foreground" : "bg-card shadow-card")}
        >
          Gelen mesajlar
          {supportUnread > 0 && <span className="rounded-full bg-lime-foreground px-2 text-xs leading-5 text-lime tabular-nums">{supportUnread} yeni</span>}
        </Link>
      </header>

      <section aria-labelledby="summary" className="flex flex-col gap-3">
        <h2 id="summary" className="text-base font-semibold">
          Son 7 gün
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile tone="ink" label="Aktif eğitmen" value={o.active_trainers_7} hint="yoklama alan" />
          <StatTile label="Eğitmen" value={o.trainers} hint={`${o.new_trainers_7} yeni · ${o.onboarded} başladı`} />
          <StatTile label="Yoklama" value={o.marked_7} hint={`${o.confirmed_7} “Geliyorum” onayı`} />
          <StatTile label="Başvuru" value={o.applications_7} hint={`${o.published} yayında sayfa`} />
          <StatTile label="Aktif danışan" value={o.clients} hint="tüm eğitmenlerde" />
          <StatTile label="Sayfasını açan danışan" value={o.portal_clients_7} />
          <StatTile label="Mesaj" value={o.messages_7} />
          <StatTile label="Bildirim açık" value={`${o.trainers_with_push} / ${o.clients_with_push}`} hint="eğitmen / danışan" />
        </div>
      </section>

      <section aria-labelledby="funnel" className="flex flex-col gap-3">
        <h2 id="funnel" className="text-base font-semibold">
          Eğitmenler nereye kadar geldi
        </h2>
        <ol className="flex flex-col gap-2 surface p-4">
          {funnel.map((f) => (
            <li key={f.label} className="grid grid-cols-[9rem_1fr_3rem] items-center gap-3 text-sm sm:grid-cols-[11rem_1fr_4rem]">
              <span className="truncate">{f.label}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-foreground" style={{ width: `${(f.n / top) * 100}%` }} />
              </span>
              <span className="text-right font-semibold tabular-nums">{f.n}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="weeks" className="flex flex-col gap-3">
        <h2 id="weeks" className="text-base font-semibold">
          Haftalar
        </h2>
        <div className="overflow-x-auto surface">
          <table className="w-full min-w-[36rem] text-sm">
            <thead className="border-b text-xs text-muted-foreground">
              <tr>
                {["Hafta", "Yeni eğitmen", "Ders", "Yoklama", "Yeni danışan", "Başvuru", "Onaylı ödeme"].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2 text-left font-medium first:pl-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {weeks.map((w, i) => (
                <tr key={w.week} className={cn(i === weeks.length - 1 && "bg-muted/40")}>
                  <td className="px-3 py-2 pl-4 whitespace-nowrap">
                    {weekLabel(w.week)}
                    {i === weeks.length - 1 && <span className="ml-1 text-xs text-muted-foreground">(bu hafta)</span>}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{w.newTrainers}</td>
                  <td className="px-3 py-2 tabular-nums">{w.lessons}</td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2 tabular-nums">
                      <span className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                        <span className="block h-full rounded-full bg-lime" style={{ width: `${(w.marked / maxWeek) * 100}%` }} />
                      </span>
                      {w.marked}
                    </span>
                  </td>
                  <td className="px-3 py-2 tabular-nums">{w.newClients}</td>
                  <td className="px-3 py-2 tabular-nums">{w.applications}</td>
                  <td className="px-3 py-2 tabular-nums">{w.payments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="trainers" className="flex flex-col gap-3">
        <h2 id="trainers" className="text-base font-semibold">
          Eğitmenler <span className="font-normal text-muted-foreground">· {trainers.length}</span>
        </h2>
        <div className="overflow-x-auto surface">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="border-b text-xs text-muted-foreground">
              <tr>
                {["Eğitmen", "Kayıt", "Başladı", "Danışan", "Son 7 gün ders", "Son hareket"].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2 text-left font-medium first:pl-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {trainers.map((t) => (
                <tr key={t.id}>
                  <td className="max-w-56 px-3 py-2 pl-4">
                    <span className="block truncate font-medium">{t.name || "—"}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {t.email}
                      {t.slug && ` · /${t.slug}`}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{fmtDate(t.createdAt)}</td>
                  <td className="px-3 py-2">{t.onboarded ? "Evet" : <span className="text-warning-strong">Hayır</span>}</td>
                  <td className="px-3 py-2 tabular-nums">{t.clients}</td>
                  <td className="px-3 py-2 tabular-nums">{t.lessons7}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{ago(t.lastActive)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
