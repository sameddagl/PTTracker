import type { CalendarLesson } from "@/db/lessons";

export type LessonTone = "planned" | "done" | "missed" | "cancelled";

/** Visual state of a lesson on the calendar, from its attendees. */
export function lessonTone(l: CalendarLesson): LessonTone {
  if (l.lessonStatus === "cancelled") return "cancelled";
  if (l.attendees.length === 0 || l.attendees.some((a) => a.status === "scheduled")) return "planned";
  if (l.attendees.some((a) => a.status === "attended")) return "done";
  return "missed";
}

/** Filled blocks in the week grid. */
export const TONE_CLASSES: Record<LessonTone, string> = {
  planned: "border-transparent bg-lime text-lime-foreground hover:bg-lime/85",
  done: "border-success/30 bg-success/15 hover:bg-success/25",
  missed: "border-warning/30 bg-warning/15 hover:bg-warning/25",
  cancelled: "border-border bg-muted text-muted-foreground line-through hover:bg-secondary",
};

/** The coloured edge on agenda cards. */
export const TONE_BARS: Record<LessonTone, string> = {
  planned: "bg-foreground",
  done: "bg-success",
  missed: "bg-warning",
  cancelled: "bg-border",
};

export const TONE_LABELS: Record<LessonTone, string> = {
  planned: "Planlı",
  done: "Yapıldı",
  missed: "Gelmedi / iptal",
  cancelled: "İptal edildi",
};

/** Places taken in a group class: booked, came or didn't show (cancels free the place). */
export const takenPlaces = (l: CalendarLesson) =>
  l.attendees.filter((a) => a.status === "scheduled" || a.status === "attended" || a.status === "no_show").length;

/** Group classes by name with their fill ("Grup Reformer · 5/8"), others by who's in them. */
export const lessonTitle = (l: CalendarLesson) =>
  l.groupClassId
    ? `${l.title ?? "Grup dersi"} · ${takenPlaces(l)}/${l.capacity ?? "?"}`
    : l.attendees.map((a) => a.name).join(", ") || l.title || "Ders";

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
