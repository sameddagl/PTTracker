import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { getTrainer } from "@/db/queries";
import { listMembers } from "@/db/team";
import { todayISO } from "@/lib/format";
import { GroupForm } from "../group-form";

export const metadata: Metadata = { title: "Yeni grup dersi" };

export default async function NewGroupClassPage() {
  const { today, team, me } = await withTrainer(async (tx, trainerId, member) => ({
    today: todayISO((await getTrainer(tx, trainerId)).timezone),
    team: await listMembers(tx, trainerId),
    me: member.id,
  }));
  return (
    <>
      <Link href="/takvim/grup" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Grup dersleri
      </Link>
      <PageHeader title="Yeni grup dersi" description="Takviminde her zaman önündeki 4 haftanın dersleri görünür; yeni haftalar kendiliğinden eklenir." />
      <GroupForm
        initial={{ title: "", weekdays: "2,4", startTime: "18:00", durationMinutes: "60", capacity: "8", joinMode: "both", startsOn: today, instructorId: me }}
        instructors={team.map((m) => ({ id: m.id, name: m.fullName || "İsimsiz" }))}
      />
    </>
  );
}
