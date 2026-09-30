import "server-only";
import { SESSION_TYPE_LABELS } from "./format";
import { notifyClient } from "./notify";
import { renderTemplate, type MessageTemplates } from "./templates";
import { whenPhrase } from "./when";

export type ReminderTarget = {
  attendeeId: string;
  trainerId: string;
  clientId: string;
  clientName: string;
  trainerName: string;
  timezone: string;
  startsAt: Date;
  title: string | null;
  sessionType: string;
  templates: MessageTemplates;
};

export const lessonLabel = (title: string | null, sessionType: string) =>
  title ?? `${SESSION_TYPE_LABELS[sessionType as keyof typeof SESSION_TYPE_LABELS] ?? ""} ders`.trim();

/**
 * "Geliyor musun?" for one booking, in the trainer's words. Push only (the client
 * can turn it off); the answer buttons wait at the top of their page.
 */
export function sendLessonReminder(r: ReminderTarget) {
  const body = renderTemplate(r.templates, "reminder", {
    ad: r.clientName,
    zaman: whenPhrase(r.startsAt, r.timezone),
    ders: lessonLabel(r.title, r.sessionType),
  });
  return notifyClient(
    { trainerId: r.trainerId, clientId: r.clientId },
    "reminder",
    { title: r.trainerName, body, hash: "#yaklasan", tag: `reminder-${r.attendeeId}` },
  );
}
