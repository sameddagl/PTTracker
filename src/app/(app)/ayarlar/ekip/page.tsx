import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { PageHeader, SectionTitle } from "@/components/page-header";
import { withTrainer } from "@/db";
import { getTrainer } from "@/db/queries";
import { listMembers, listOpenInvites } from "@/db/team";
import { formatShortDate, formatTRY } from "@/lib/format";
import { payRuleLabel } from "@/lib/payroll";
import { profileImageUrl } from "@/lib/storage";
import { nextTeamColor, teamColor } from "@/lib/team";
import { InviteActions, InviteForm, ReactivateButton, TeamSetting } from "./team-forms";

export const metadata: Metadata = { title: "Ekip" };

export default async function TeamPage({ searchParams }: PageProps<"/ayarlar/ekip">) {
  const { ilk } = await searchParams;
  const data = await withTrainer(async (tx, id, member) => {
    if (member.role !== "owner") return null;
    return {
      trainer: await getTrainer(tx, id),
      members: await listMembers(tx, id, { includeInactive: true }),
      invites: await listOpenInvites(tx, id),
    };
  });
  if (!data) notFound();
  const { trainer, members, invites } = data;
  const active = members.filter((m) => m.active);
  const removed = members.filter((m) => !m.active);

  return (
    <>
      <Link href="/ayarlar" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Ayarlar
      </Link>
      <PageHeader
        title="Ekip"
        description="Stüdyonda ders veren eğitmenler. Giriş daveti gönderdiğin eğitmen kendi e-postasıyla girer; takvimi, derslerini, yoklamayı ve danışanlarının notlarını görür, ödemeleri ve fiyatları görmez. Giriş yapmayan eğitmenin derslerini sen yönetirsin."
      />
      <div className="flex flex-col gap-8">
        {ilk === "1" && (
          <p role="status" className="rounded-2xl bg-lime px-4 py-3 text-sm text-lime-foreground">
            Stüdyon hazır. Birlikte çalıştığın eğitmenleri aşağıdan davet et; istersen bunu sonra da yapabilirsin.{" "}
            <Link href="/bugun" className="font-medium underline underline-offset-2">
              Şimdilik geç
            </Link>
          </p>
        )}
        <section aria-labelledby="members-heading">
          <SectionTitle id="members-heading">Eğitmenler</SectionTitle>
          <ul className="divide-y overflow-hidden surface">
            {active.map((m, i) => (
              <li key={m.id}>
                <Link href={`/ayarlar/ekip/${m.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
                  <span className="relative shrink-0">
                    <Avatar name={m.fullName || "?"} src={profileImageUrl(m.photoPath)} />
                    <span className="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full ring-2 ring-card" style={{ background: teamColor(m.color, i) }} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {m.fullName || "İsimsiz"}
                      {m.role === "owner" && <span className="ml-2 text-xs font-normal text-muted-foreground">Sahip</span>}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {m.role === "owner" ? "Bütün ayarlar ve ödemeler" : `${m.userId ? "" : "Giriş yok · "}${payRuleLabel(m.payRule, formatTRY)}`}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {invites.length > 0 && (
          <section aria-labelledby="invites-heading">
            <SectionTitle id="invites-heading">Bekleyen davetler</SectionTitle>
            <ul className="divide-y overflow-hidden surface">
              {invites.map((inv) => (
                <li key={inv.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{inv.fullName}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {inv.email} · {formatShortDate(inv.expiresAt.toISOString().slice(0, 10))} tarihine kadar geçerli
                    </span>
                  </span>
                  <InviteActions id={inv.id} email={inv.email} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="invite-heading" className="flex flex-col gap-4 surface p-5">
          <div>
            <h2 id="invite-heading" className="text-base font-semibold">
              Eğitmen ekle
            </h2>
            <p className="text-sm text-muted-foreground">
              E-posta yazarsan eğitmene giriş daveti gider; linke tıklayıp girdiğinde uygulamayı kullanır. Yazmazsan eğitmen hemen eklenir,
              derslerini, yoklamasını ve hakedişini sen yönetirsin. Giriş davetini sonra da gönderebilirsin.
            </p>
          </div>
          <InviteForm suggestedColor={nextTeamColor(active.map((m) => m.color))} />
        </section>

        <section aria-labelledby="team-settings-heading">
          <SectionTitle id="team-settings-heading">Ekip ayarları</SectionTitle>
          <div className="divide-y overflow-hidden surface">
            <TeamSetting
              name="payrollCountsMissed"
              initial={trainer.payrollCountsMissed}
              title="Geç iptal ve gelmeyenler hakedişe sayılsın"
              hint="Açıksa danışan gelmese de paketinden düşen ders eğitmene ödenir."
            />
          </div>
        </section>

        {removed.length > 0 && (
          <section aria-labelledby="removed-heading">
            <SectionTitle id="removed-heading">Ekipten çıkarılanlar</SectionTitle>
            <ul className="divide-y overflow-hidden surface">
              {removed.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={m.fullName || "?"} />
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{m.fullName}</span>
                  <ReactivateButton id={m.id} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
