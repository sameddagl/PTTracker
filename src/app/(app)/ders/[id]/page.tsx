import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Ban, ChevronLeft, Repeat, RotateCcw } from "lucide-react";
import { AttendanceRow } from "@/components/attendance-row";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { getLesson, listClientOptions } from "@/db/lessons";
import { getTrainer } from "@/db/queries";
import { listMembers } from "@/db/team";
import { can } from "@/lib/permissions";
import { teamColor } from "@/lib/team";
import { dayLong } from "@/lib/dates";
import { SESSION_TYPE_LABELS } from "@/lib/format";
import { lessonTitle, minutesToTime, takenPlaces } from "../../takvim/lesson-summary";
import { cancelLessonAction, restoreLessonAction } from "./actions";
import { AddAttendee } from "./add-attendee";
import { InstructorPicker } from "./instructor-picker";
import { RescheduleForm } from "./reschedule-form";

export const metadata: Metadata = { title: "Ders" };

export default async function LessonPage({ params }: PageProps<"/ders/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const data = await withTrainer(async (tx, trainerId, member) => {
    const trainer = await getTrainer(tx, trainerId);
    const lesson = await getLesson(tx, trainer, id);
    if (!lesson) return null;
    // A colleague's lesson is off limits without permission to see others' lessons.
    if (member.role !== "owner" && lesson.instructorId !== member.id && !can(member, "seeOthersLessons")) return null;
    return { lesson, member, team: await listMembers(tx, trainerId), clients: await listClientOptions(tx, trainerId) };
  });
  if (!data) notFound();
  const { lesson, member, team } = data;
  const studio = team.length > 1;
  const instructor = team.find((m) => m.id === lesson.instructorId);
  // An instructor takes attendance in their own lessons; changing them needs the owner's permission.
  const own = member.role === "owner" || lesson.instructorId === member.id;
  const canManage = own;
  const canEdit = own && can(member, "manageLessons");
  const inLesson = new Set(lesson.attendees.filter((a) => a.status !== "cancelled").map((a) => a.clientId));
  const addable = data.clients.filter((c) => !inLesson.has(c.id));
  const full = lesson.capacity !== null && takenPlaces(lesson) >= lesson.capacity;

  const cancelled = lesson.lessonStatus === "cancelled";
  const start = minutesToTime(lesson.startMinute);
  const calendarHref = `/takvim?gun=${lesson.localDate}`;

  return (
    <>
      <Link href={calendarHref} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Takvim
      </Link>
      <PageHeader
        title={lesson.groupClassId ? (lesson.title ?? "Grup dersi") : lessonTitle(lesson)}
        description={
          <span className="inline-flex flex-wrap items-center gap-x-1.5">
            <span className="capitalize">{dayLong(lesson.localDate)}</span>·
            <span className="tabular-nums">
              {start}–{minutesToTime(lesson.startMinute + lesson.durationMinutes)}
            </span>
            · {SESSION_TYPE_LABELS[lesson.sessionType]}
            {lesson.bookedByClient && <span>· Danışan randevusu</span>}
            {studio && instructor && (
              <span className="inline-flex items-center gap-1.5">
                · <span className="size-2.5 rounded-full" style={{ background: teamColor(instructor.color, team.indexOf(instructor)) }} aria-hidden />
                {instructor.fullName}
              </span>
            )}
            {lesson.seriesId && (
              <span className="inline-flex items-center gap-1">
                · <Repeat className="size-3.5" aria-hidden /> Tekrarlayan
              </span>
            )}
            {lesson.groupClassId && (
              <Link href={`/takvim/grup/${lesson.groupClassId}`} className="inline-flex items-center gap-1 underline-offset-2 hover:underline">
                · <Repeat className="size-3.5" aria-hidden /> Grup dersi
              </Link>
            )}
          </span>
        }
      />

      {studio && member.role === "owner" && !cancelled && (
        <section aria-label="Eğitmen" className="mb-6 surface p-4">
          <InstructorPicker
            lessonId={lesson.lessonId}
            current={lesson.instructorId}
            instructors={team.map((m) => ({ id: m.id, name: m.fullName || "İsimsiz" }))}
            series={Boolean(lesson.seriesId)}
          />
        </section>
      )}

      {!canManage ? (
        <section aria-label="Danışanlar" className="mb-8">
          <p className="mb-3 text-sm text-muted-foreground">Bu dersi {instructor?.fullName ?? "başka bir eğitmen"} veriyor; yoklamayı o alır.</p>
          <ul className="divide-y overflow-hidden surface">
            {lesson.attendees.map((a) => (
              <li key={a.id} className="px-4 py-3 text-sm font-medium">
                {a.name}
              </li>
            ))}
          </ul>
        </section>
      ) : cancelled ? (
        <Card className="mb-6 border-dashed">
          <CardContent className="flex items-center gap-3">
            <Ban className="size-4 text-muted-foreground" aria-hidden />
            <p className="flex-1 text-sm">Bu ders iptal edildi. Kimsenin paketinden düşmedi.</p>
            {canEdit && (
              <form action={restoreLessonAction}>
                <input type="hidden" name="lessonId" value={lesson.lessonId} />
                <SubmitButton variant="outline" size="sm">
                  <RotateCcw />
                  Geri al
                </SubmitButton>
              </form>
            )}
          </CardContent>
        </Card>
      ) : (
        <section aria-labelledby="attendance-heading" className="mb-8">
          <h2 id="attendance-heading" className="mb-3 text-base font-semibold">
            Yoklama
            {lesson.capacity !== null && (
              <span className="tabular-nums">
                {" "}
                · {takenPlaces(lesson)}/{lesson.capacity} dolu
              </span>
            )}
          </h2>
          {lesson.attendees.length === 0 ? (
            <p className="mb-3 text-sm text-muted-foreground">Bu derste danışan yok.</p>
          ) : (
            <Card>
              <CardContent className="flex flex-col gap-5">
                {lesson.attendees.map((a) => (
                  <AttendanceRow key={a.id} attendee={a} />
                ))}
              </CardContent>
            </Card>
          )}
          {!full && canEdit && (
            <div className="mt-3">
              <AddAttendee lessonId={lesson.lessonId} clients={addable} />
            </div>
          )}
        </section>
      )}

      {lesson.notes && (
        <section className="mb-8">
          <h2 className="mb-2 text-base font-semibold">Not</h2>
          <p className="text-sm whitespace-pre-wrap">{lesson.notes}</p>
        </section>
      )}

      {!cancelled && canEdit && (
        <section aria-label="Ders işlemleri" className="flex flex-col gap-3">
          <RescheduleForm
            lessonId={lesson.lessonId}
            date={lesson.localDate}
            time={start}
            durationMinutes={lesson.durationMinutes}
          />
          <div className="flex flex-wrap gap-2">
            <form action={cancelLessonAction}>
              <input type="hidden" name="lessonId" value={lesson.lessonId} />
              <SubmitButton variant="ghost" className="text-destructive-strong hover:text-destructive-strong">
                <Ban />
                Dersi iptal et
              </SubmitButton>
            </form>
            {lesson.seriesId && (
              <form action={cancelLessonAction}>
                <input type="hidden" name="lessonId" value={lesson.lessonId} />
                <input type="hidden" name="following" value="true" />
                <SubmitButton variant="ghost" className="text-destructive-strong hover:text-destructive-strong">
                  Bu ve sonraki dersleri iptal et
                </SubmitButton>
              </form>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Dersi sen iptal edersen kimsenin paketinden düşmez. Danışan iptal ettiyse yoklamada &quot;İptal&quot; ya da
            &quot;Geç iptal&quot;i kullan.
          </p>
        </section>
      )}
    </>
  );
}
