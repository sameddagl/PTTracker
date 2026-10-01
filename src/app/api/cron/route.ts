import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { adminDb, type Tx } from "@/db";
import {
  dueReminders,
  dueWeeklySummaries,
  installmentRemindersDue,
  markInstallmentReminded,
  markReminded,
  markRenewalOffered,
  markWeeklySent,
  renewalCandidates,
  trainersWithGroups,
} from "@/db/engagement";
import { ensureGroupOccurrences } from "@/db/groups";
import { markMeasureReminded, measureRemindersDue } from "@/db/progress";
import { formatShortDate, formatTRY } from "@/lib/format";
import { APP_NAME } from "@/lib/config";
import { notifyClient, notifyTrainer } from "@/lib/notify";
import { sendLessonReminder } from "@/lib/reminder";
import { renderTemplate } from "@/lib/templates";

// Scheduled work, called every 15 minutes by the host's cron:
//   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://<site>/api/cron
// Every job is idempotent (a row is marked once handled), so a missed or
// doubled run does no harm.

export const dynamic = "force-dynamic";

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || given.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(secret));
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const tx = adminDb as unknown as Tx;
  const report = { groups: 0, reminders: 0, renewals: 0, installments: 0, measures: 0, summaries: 0 };

  // 1. Keep group-class occurrences (and their fixed members) four weeks ahead,
  //    even for trainers who haven't opened the app, so reminders can go out.
  for (const t of await trainersWithGroups(tx)) {
    await adminDb.transaction((t2) => ensureGroupOccurrences(t2 as unknown as Tx, t));
    report.groups++;
  }

  // 2. "Geliyor musun?" before each booked lesson, as long before as the trainer chose.
  const reminders = await dueReminders(tx);
  for (const r of reminders) await sendLessonReminder(r);
  await markReminded(tx, reminders.map((r) => r.attendeeId));
  report.reminders = reminders.length;

  // 3. A package running out: offer to renew it (once per package).
  const renewals = await renewalCandidates(tx);
  for (const p of renewals) {
    const why = p.remaining <= 0 ? "Paketindeki dersler bitti." : p.remaining <= 2 ? `Paketinde ${p.remaining} ders kaldı.` : "Paketinin süresi bitmek üzere.";
    const body = renderTemplate(p.templates, "renewal", { ad: p.clientName, paket: p.packageName, durum: why });
    await notifyClient(
      { trainerId: p.trainerId, clientId: p.clientId },
      "package",
      {
        title: `${p.packageName}`,
        body,
        hash: "#paketler",
        tag: `renew-${p.clientPackageId}`,
        email: {
          subject: `${p.trainerName} · ${p.remaining <= 0 ? "Paketin bitti" : "Paketin bitmek üzere"}`,
          heading: p.remaining <= 0 ? "Paketin bitti" : "Paketin bitmek üzere",
          lines: [body],
          cta: "Paketimi yenile",
        },
      },
    );
  }
  await markRenewalOffered(tx, renewals.map((p) => p.clientPackageId));
  report.renewals = renewals.length;

  // 4. Installments: the day before, and once more when it's past due without a report.
  const installments = await installmentRemindersDue(tx);
  for (const i of installments) {
    await notifyClient({ trainerId: i.trainerId, clientId: i.clientId }, "package", {
      title: i.trainerName,
      body: renderTemplate(i.templates, i.kind === "soon" ? "installmentSoon" : "installmentLate", {
        ad: i.clientName,
        paket: i.packageName,
        taksit: i.seq,
        tutar: formatTRY(i.amount),
        tarih: formatShortDate(i.dueOn),
      }),
      hash: "#odeme",
      tag: `installment-${i.clientPackageId}-${i.seq}`,
    });
  }
  await markInstallmentReminded(tx, installments);
  report.installments = installments.length;

  // 5. Periodic measurements: "Ölçüm zamanı geldi", once per interval.
  const measures = await measureRemindersDue(tx);
  for (const m of measures) {
    await notifyClient({ trainerId: m.trainerId, clientId: m.clientId }, "program", {
      title: m.trainerName,
      body: renderTemplate(m.templates, "measureReminder", { ad: m.clientName }),
      hash: "#ilerleme",
      tag: `measure-${m.clientId}`,
    });
  }
  await markMeasureReminded(tx, measures);
  report.measures = measures.length;

  // 6. Monday morning summary for each trainer.
  for (const s of await dueWeeklySummaries(tx)) {
    const lines = [
      `Geçen hafta ${s.lessons} ders verdin, ${s.attended} kez katılım oldu${s.missed > 0 ? `; ${s.missed} kez danışan gelmedi ya da son anda iptal etti` : ""}.`,
      `Tahsilat: ${formatTRY(s.income)}${s.newClients > 0 ? ` · ${s.newClients} yeni danışan` : ""}.`,
      s.endingSoon > 0 ? `${s.endingSoon} paket bitmek üzere, yenilemek için danışanlarınla konuşabilirsin.` : "Bitmek üzere olan paket yok.",
      s.lost.length > 0
        ? `Bir süredir gelmeyenler: ${s.lost.map((l) => l.name).join(", ")}.`
        : "Uzun süredir gelmeyen danışanın yok.",
    ];
    await notifyTrainer(s.trainerId, "weekly", {
      title: "Haftalık özetin hazır",
      body: lines.slice(0, 2).join(" "),
      path: "/bugun",
      tag: `weekly-${s.week}`,
      email: { subject: `${APP_NAME} · Haftalık özetin`, heading: "Haftalık özet", lines, cta: "Bugün'e git" },
    });
    await markWeeklySent(tx, s.trainerId, s.week);
    report.summaries++;
  }

  return NextResponse.json({ ok: true, ...report });
}
