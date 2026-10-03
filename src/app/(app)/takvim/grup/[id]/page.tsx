import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { JOIN_MODE_LABELS, ensureGroupOccurrences, getGroupClass } from "@/db/groups";
import { listClientOptions } from "@/db/lessons";
import { getTrainer } from "@/db/queries";
import { listMembers } from "@/db/team";
import { weekdayList } from "@/lib/dates";
import { formatDayMonth, formatTime, todayISO } from "@/lib/format";
import { GroupForm } from "../group-form";
import { EndGroupButton, MemberList } from "./members";

export const metadata: Metadata = { title: "Grup dersi" };

export default async function GroupClassPage({ params }: PageProps<"/takvim/grup/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const data = await withTrainer(async (tx, trainerId) => {
    const trainer = await getTrainer(tx, trainerId);
    await ensureGroupOccurrences(tx, trainer, { classId: id });
    const group = await getGroupClass(tx, trainer, id);
    if (!group) return null;
    return { group, clients: await listClientOptions(tx, trainerId), tz: trainer.timezone, today: todayISO(trainer.timezone), team: await listMembers(tx, trainerId) };
  });
  if (!data) notFound();
  const { group: g, clients, tz, today, team } = data;
  const live = !g.endsOn || g.endsOn >= today;
  const memberIds = new Set(g.members.map((m) => m.clientId));

  return (
    <>
      <Link href="/takvim/grup" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Grup dersleri
      </Link>
      <PageHeader
        title={g.title}
        description={`${weekdayList(g.weekdays)} · ${g.startTime} · ${g.durationMinutes} dk · ${g.capacity} kişi`}
        action={!live && <Badge variant="secondary">Bitti</Badge>}
      />

      <section aria-labelledby="upcoming-heading" className="mb-8">
        <h2 id="upcoming-heading" className="mb-3 text-base font-semibold">
          Önümüzdeki dersler
        </h2>
        {g.upcoming.length === 0 ? (
          <p className="rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">Planlı ders yok.</p>
        ) : (
          <ul className="divide-y overflow-hidden surface">
            {g.upcoming.map((l) => {
              const full = l.capacity !== null && l.taken >= l.capacity;
              return (
                <li key={l.id}>
                  <Link href={`/ders/${l.id}`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50">
                    <span className="w-16 shrink-0 tabular-nums">{formatDayMonth(l.startsAt, tz)}</span>
                    <span className="w-12 shrink-0 text-muted-foreground tabular-nums">{formatTime(l.startsAt, tz)}</span>
                    <span className="flex-1">
                      {l.status === "cancelled" ? (
                        <span className="text-muted-foreground line-through">İptal</span>
                      ) : (
                        <span className="tabular-nums">
                          {l.taken}/{l.capacity} dolu
                        </span>
                      )}
                    </span>
                    {l.status !== "cancelled" && full && <Badge variant="outline">Dolu</Badge>}
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {g.joinMode !== "drop_in" && (
        <section aria-labelledby="members-heading" className="mb-8">
          <h2 id="members-heading" className="mb-1 text-sm font-medium text-muted-foreground">
            Sabit üyeler · {g.members.length}/{g.capacity}
          </h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Yerleri her hafta ayrılır, dersleri grup paketlerinden düşer. Gelemeyecekleri haftayı kendi sayfalarından iptal edebilirler.
          </p>
          <MemberList
            classId={g.id}
            live={live}
            full={g.members.length >= g.capacity}
            today={today}
            members={g.members.map((m) => ({ id: m.id, clientId: m.clientId, name: m.name, since: formatDayMonth(new Date(`${m.startsOn}T12:00:00Z`), tz) }))}
            clients={clients.filter((c) => !memberIds.has(c.id))}
          />
        </section>
      )}

      {live && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">Ayarlar</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <p className="text-sm text-muted-foreground">
              {JOIN_MODE_LABELS[g.joinMode]}. Gün ve saati değiştirmek için bu dersi bitirip yenisini oluştur; geçmiş dersler kaybolmaz.
            </p>
            <GroupForm
              id={g.id}
              initial={{ title: g.title, capacity: String(g.capacity), joinMode: g.joinMode, instructorId: g.instructorId ?? undefined }}
              instructors={team.map((m) => ({ id: m.id, name: m.fullName || "İsimsiz" }))}
            />
          </CardContent>
        </Card>
      )}

      {live && <EndGroupButton classId={g.id} title={g.title} />}
    </>
  );
}
