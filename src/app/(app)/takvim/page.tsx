import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { ensureGroupOccurrences } from "@/db/groups";
import { getLessons } from "@/db/lessons";
import { getTrainer } from "@/db/queries";
import { listMembers } from "@/db/team";
import { can } from "@/lib/permissions";
import { teamColor } from "@/lib/team";
import { addDays, eachDay, isISODate, startOfWeek, weekRangeLabel } from "@/lib/dates";
import { todayISO } from "@/lib/format";
import { CalendarView } from "./calendar-view";

export const metadata: Metadata = { title: "Takvim" };

export default async function CalendarPage({ searchParams }: PageProps<"/takvim">) {
  const { hafta, gun, egitmen } = await searchParams;

  const { trainer, lessons, today, monday, member, team } = await withTrainer(async (tx, trainerId, member) => {
    const trainer = await getTrainer(tx, trainerId);
    const today = todayISO(trainer.timezone);
    const monday = startOfWeek(isISODate(gun) ? gun : isISODate(hafta) ? hafta : today);
    await ensureGroupOccurrences(tx, trainer);
    const lessons = await getLessons(tx, trainer, { from: monday, to: addDays(monday, 6), includeCancelled: true });
    return { trainer, lessons, today, monday, member, team: await listMembers(tx, trainerId) };
  });

  // Studios: colour per instructor and a filter. An instructor starts on their own lessons, the owner on everyone's.
  const studio = team.length > 1;
  const colors: Record<string, string> = Object.fromEntries(team.map((m, i) => [m.id, teamColor(m.color, i)]));
  const canPlan = can(member, "manageLessons");
  // Without permission to see colleagues' lessons, an instructor's calendar is just theirs.
  const seeOthers = can(member, "seeOthersLessons");
  const filter = !studio
    ? "hepsi"
    : !seeOthers
      ? member.id
      : egitmen === "hepsi" || team.some((m) => m.id === egitmen)
        ? (egitmen as string)
        : member.role === "owner"
          ? "hepsi"
          : member.id;
  const days = eachDay(monday, addDays(monday, 6));
  const selected = isISODate(gun) && days.includes(gun) ? gun : days.includes(today) ? today : monday;
  // The red "now" line: computed here so server and browser draw it in the same place.
  const nowParts = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "numeric", hourCycle: "h23", timeZone: trainer.timezone })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((acc, p) => ({ ...acc, [p.type]: p.value }), {});
  const nowMinute = Number(nowParts.hour) * 60 + Number(nowParts.minute);
  // Chips only when the member may look at colleagues' lessons.
  const chips =
    studio && seeOthers ? team.map((m) => ({ id: m.id, label: m.id === member.id ? "Ben" : m.fullName.split(" ")[0] || "İsimsiz", color: colors[m.id] })) : [];

  return (
    <>
      <PageHeader title="Takvim" />
      <CalendarView
        // A new week (or a link to another view) starts the client state over.
        key={`${monday}-${selected}-${filter}`}
        // Without permission to see colleagues' lessons, theirs never reach the browser.
        lessons={seeOthers ? lessons : lessons.filter((l) => l.instructorId === member.id)}
        days={days}
        today={today}
        monday={monday}
        rangeLabel={weekRangeLabel(monday)}
        prevWeek={addDays(monday, -7)}
        nextWeek={addDays(monday, 7)}
        initialDay={selected}
        initialFilter={filter}
        team={chips}
        canPlan={canPlan}
        isOwner={member.role === "owner"}
        nowMinute={nowMinute}
      />
    </>
  );
}
