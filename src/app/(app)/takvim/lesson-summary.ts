import type { CalendarLesson } from "@/db/lessons";

export type LessonTone = "planned" | "done" | "missed" | "cancelled";

/** Visual state of a lesson on the calendar, from its attendees. */
export function lessonTone(l: CalendarLesson): LessonTone {
  if (l.lessonStatus === "cancelled") return "cancelled";
  if (l.attendees.length === 0 || l.attendees.some((a) => a.status === "scheduled")) return "planned";
  if (l.attendees.some((a) => a.status === "attended")) return "done";
  return "missed";
}

export const TONE_CLASSES: Record<LessonTone, string> = {
  planned: "border-primary/40 bg-primary/10 hover:bg-primary/15",
  done: "border-emerald-600/40 bg-emerald-600/10 hover:bg-emerald-600/15",
  missed: "border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/15",
  cancelled: "border-border bg-muted/40 text-muted-foreground line-through hover:bg-muted/60",
};

export const TONE_LABELS: Record<LessonTone, string> = {
  planned: "Planlı",
  done: "Yapıldı",
  missed: "Gelmedi / iptal",
  cancelled: "İptal edildi",
};

export const lessonTitle = (l: CalendarLesson) => l.attendees.map((a) => a.name).join(", ") || l.title || "Ders";

export const minutesToTime = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/**
 * Side-by-side lanes for overlapping lessons in one day: each lesson gets a
 * lane index and the lane count of its overlap cluster.
 */
export function layoutDay(lessons: CalendarLesson[]) {
  const sorted = [...lessons].sort((a, b) => a.startMinute - b.startMinute);
  const placed: { lesson: CalendarLesson; lane: number; lanes: number }[] = [];
  let cluster: typeof placed = [];
  let clusterEnd = -1;
  let laneEnds: number[] = [];

  const closeCluster = () => {
    const lanes = laneEnds.length;
    for (const p of cluster) p.lanes = lanes;
    cluster = [];
    laneEnds = [];
  };

  for (const lesson of sorted) {
    const end = lesson.startMinute + lesson.durationMinutes;
    if (lesson.startMinute >= clusterEnd) closeCluster();
    let lane = laneEnds.findIndex((e) => e <= lesson.startMinute);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else laneEnds[lane] = end;
    const p = { lesson, lane, lanes: 1 };
    cluster.push(p);
    placed.push(p);
    clusterEnd = Math.max(clusterEnd, end);
  }
  closeCluster();
  return placed;
}
