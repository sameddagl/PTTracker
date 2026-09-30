import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { adminDb, type Tx } from "@/db";
import {
  dueReminders,
  dueWeeklySummaries,
  markReminded,
  markRenewalOffered,
  markWeeklySent,
  renewalCandidates,
  trainersWithGroups,
} from "@/db/engagement";
import { ensureGroupOccurrences } from "@/db/groups";
import { SESSION_TYPE_LABELS, formatTRY } from "@/lib/format";
import { APP_NAME } from "@/lib/config";
import { notifyClient, notifyTrainer } from "@/lib/notify";
import { whenPhrase } from "@/lib/when";

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
  const report = { groups: 0, reminders: 0, renewals: 0, summaries: 0 };

  // 1. Keep group-class occurrences (and their fixed members) four weeks ahead,
  //    even for trainers who haven't opened the app, so reminders can go out.
  for (const t of await trainersWithGroups(tx)) {
    await adminDb.transaction((t2) => ensureGroupOccurrences(t2 as unknown as Tx, t));
    report.groups++;
  }

  // 2. "Geliyor musun?" before each booked lesson.
  const reminders = await dueReminders(tx);
  for (const r of reminders) {
    const when = whenPhrase(r.startsAt, r.timezone);
    const what = r.title ?? `${SESSION_TYPE_LABELS[r.sessionType as keyof typeof SESSION_TYPE_LABELS]} ders`;
    await notifyClient(
      { trainerId: r.trainerId, clientId: r.clientId },
      "reminder",
      {
        title: `${when} dersin var`,
        body: `${what} · ${r.trainerName}. Geliyor musun? Dokun, tek tuşla onayla.`,
        hash: "#dersler",
        tag: `reminder-${r.attendeeId}`,
        email: {
          subject: `${r.trainerName} · ${when} dersin var`,
          heading: `${when[0].toLocaleUpperCase("tr")}${when.slice(1)} dersin var`,
          lines: [`${what}, ${r.trainerName} ile.`, "Gelebilecek misin? Sayfandan tek dokunuşla onaylayabilir ya da iptal edebilirsin."],
          cta: "Geliyorum / Gelemiyorum",
        },
      },
    );
  }
  await markReminded(tx, reminders.map((r) => r.attendeeId));
  report.reminders = reminders.length;

  // 3. A package running out: offer to renew it (once per package).
  const renewals = await renewalCandidates(tx);
  for (const p of renewals) {
    const why = p.remaining <= 0 ? "Paketindeki dersler bitti." : p.remaining <= 2 ? `Paketinde ${p.remaining} ders kaldı.` : "Paketinin süresi bitmek üzere.";
    await notifyClient(
      { trainerId: p.trainerId, clientId: p.clientId },
      "package",
      {
        title: `${p.packageName}`,
        body: `${why} Aynı paketi sayfandan tek dokunuşla yenileyebilirsin.`,
        hash: "#paketler",
        tag: `renew-${p.clientPackageId}`,
        email: {
          subject: `${p.trainerName} · Paketin bitmek üzere`,
          heading: "Paketin bitmek üzere",
          lines: [`${why}`, `${p.trainerName} ile devam etmek istersen aynı paketi sayfandan yenileyebilirsin.`],
          cta: "Paketimi yenile",
        },
      },
    );
  }
  await markRenewalOffered(tx, renewals.map((p) => p.clientPackageId));
  report.renewals = renewals.length;

  // 4. Monday morning summary for each trainer.
  for (const s of await dueWeeklySummaries(tx)) {
    const lines = [
      `Geçen hafta ${s.lessons} ders, ${s.attended} katılım${s.missed > 0 ? `, ${s.missed} gelmedi ya da geç iptal` : ""}.`,
      `Tahsilat: ${formatTRY(s.income)}${s.newClients > 0 ? ` · ${s.newClients} yeni danışan` : ""}.`,
      s.endingSoon > 0 ? `${s.endingSoon} paket bitmek üzere; yenileme için danışanlarına bakabilirsin.` : "Bu hafta bitmek üzere olan paket yok.",
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
