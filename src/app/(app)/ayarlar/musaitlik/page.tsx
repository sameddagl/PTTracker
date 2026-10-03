import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { requirePermission, withTrainer } from "@/db";
import { getAvailability } from "@/db/booking";
import { getTrainer } from "@/db/queries";
import { listMembers } from "@/db/team";
import { teamColor } from "@/lib/team";
import { cn } from "@/lib/utils";
import { todayISO } from "@/lib/format";
import { AvailabilityForm } from "./availability-form";
import { TimeOff } from "./time-off";

export const metadata: Metadata = { title: "Müsaitlik" };

export default async function AvailabilityPage({ searchParams }: PageProps<"/ayarlar/musaitlik">) {
  const { egitmen } = await searchParams;
  await requirePermission("editAvailability");
  const { trainer, rules, off, team, selected, owner } = await withTrainer(async (tx, trainerId, member) => {
    const trainer = await getTrainer(tx, trainerId);
    const owner = member.role === "owner";
    // An instructor edits only their own hours.
    const team = (await listMembers(tx, trainerId)).filter((m) => owner || m.id === member.id);
    // Studios: each instructor has their own hours; the page edits one at a time.
    const selected = team.find((m) => m.id === egitmen) ?? team.find((m) => m.id === member.id) ?? team[0];
    const { rules, off } = await getAvailability(tx, trainerId, selected.id);
    return { trainer, rules, off, team, selected, owner };
  });
  const studio = team.length > 1;

  return (
    <>
      <Link href="/ayarlar" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Ayarlar
      </Link>
      <PageHeader
        title={owner ? "Müsaitlik" : "Çalışma saatlerim"}
        description={`Danışanlar bu saatlere randevu alır. ${
          trainer.lateCancelHours === 0
            ? "İstedikleri zaman ücretsiz iptal edebilirler."
            : `Dersten ${trainer.lateCancelHours} saat öncesine kadar ücretsiz iptal edebilirler.`
        }`}
      />
      {studio && (
        <nav aria-label="Eğitmen" className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          {team.map((m, i) => (
            <Link
              key={m.id}
              href={`/ayarlar/musaitlik?egitmen=${m.id}`}
              aria-current={m.id === selected.id ? "true" : undefined}
              className={cn(
                "flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors md:min-h-9",
                m.id === selected.id ? "bg-foreground text-background" : "bg-card text-muted-foreground shadow-card hover:text-foreground",
              )}
            >
              <span className="size-2.5 rounded-full" style={{ background: teamColor(m.color, i) }} aria-hidden />
              {m.fullName || "İsimsiz"}
            </Link>
          ))}
        </nav>
      )}
      {studio && (
        <p className="mb-4 text-sm text-muted-foreground">
          {selected.fullName} için çalışma saatleri. Randevu ayarları (ders süresi, ne kadar önceden) bütün stüdyo için ortak.
        </p>
      )}
      <AvailabilityForm
        key={selected.id}
        instructorId={studio ? selected.id : undefined}
        hoursOnly={!owner}
        initial={{
          bookingEnabled: trainer.bookingEnabled,
          bookingLessonMinutes: trainer.bookingLessonMinutes,
          bookingMinNoticeHours: trainer.bookingMinNoticeHours,
          bookingHorizonDays: trainer.bookingHorizonDays,
          rules: rules.map((r) => ({ weekday: r.weekday, startMinute: r.startMinute, endMinute: r.endMinute })),
        }}
      />
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">İzin günleri</CardTitle>
        </CardHeader>
        <CardContent>
          <TimeOff key={selected.id} items={off} today={todayISO(trainer.timezone)} instructorId={studio ? selected.id : undefined} />
        </CardContent>
      </Card>
    </>
  );
}
