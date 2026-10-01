// Engagement jobs against PGlite: "Geliyor musun?" confirmations and
// reminders, renewal offers, lost clients, the weekly summary and the
// one-trial-per-person rule.
// Run with: npx tsx --conditions=react-server scripts/test-engagement.ts
import assert from "node:assert/strict";
import { TEMPLATES, cleanTemplates, renderTemplate } from "../src/lib/templates";
import { BUILTIN_METRICS, activeMetrics, formatMetric, parseMetricValue, seriesChange, spanPhrase } from "../src/lib/measurements";
import {
  addNote,
  cleanNote,
  deleteMeasurements,
  grantHealthConsent,
  listMeasurements,
  listNotes,
  portalProgress,
  saveMeasurements,
  setNoteVisibility,
  toSeries,
} from "../src/db/progress";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import type { Tx } from "../src/db";
import { requestPackage } from "../src/db/applications";
import {
  confirmAttendance,
  dueReminders,
  dueWeeklySummaries,
  lostClients,
  markReminded,
  markRenewalOffered,
  markWeeklySent,
  renewablePackages,
  renewalCandidates,
  tomorrowAttendees,
} from "../src/db/engagement";
import { activation, overview, trainerList, weekly } from "../src/db/admin-metrics";
import { createTemplate } from "../src/db/packages";
import { cleanPrefs, clientWants, notifyPrefsSchema, trainerWants } from "../src/lib/notify-prefs";
import { recordSignup } from "../src/lib/signup-core";
import { addDays } from "../src/lib/dates";
import { todayISO } from "../src/lib/format";
import { whenPhrase } from "../src/lib/when";
import { PHONE_PATTERN, normalizePhone } from "../src/lib/whatsapp";
import * as schema from "../src/db/schema";
import { addUsers, createTestDb } from "./pglite";

const A = "00000000-0000-0000-0000-0000000000a1";
const B = "00000000-0000-0000-0000-0000000000b2";
const TZ = "Europe/Istanbul";
const H = 3_600_000;
process.env.PORTAL_SECRET ??= "test-secret-test-secret-test-secret";

async function main() {
  const pg = await createTestDb();
  await addUsers(pg, [
    { id: A, name: "Ayşe Hoca" },
    { id: B, name: "Başka Hoca" },
  ]);
  const db = drizzle(pg, { schema });
  const as = <R>(trainerId: string, fn: (tx: Tx) => Promise<R>) =>
    db.transaction(async (tx) => {
      await tx.execute(sql`select set_config('request.jwt.claim.sub', ${trainerId}, true)`);
      await tx.execute(sql`set local role authenticated`);
      return fn(tx as unknown as Tx);
    });
  const owner = <R>(fn: (tx: Tx) => Promise<R>) => db.transaction((tx) => fn(tx as unknown as Tx));
  const trainer = { id: A, timezone: TZ };
  await db.update(schema.trainers).set({ onboardedAt: new Date(), timezone: TZ }).where(eq(schema.trainers.id, A));

  const [zeynep, ali, eski] = await db
    .insert(schema.clients)
    .values([
      { trainerId: A, fullName: "Zeynep Kaya", phone: "905551112233" },
      { trainerId: A, fullName: "Ali Demir" },
      { trainerId: A, fullName: "Eski Danışan", phone: "905559998877" },
    ])
    .returning({ id: schema.clients.id });
  const [other] = await db.insert(schema.clients).values({ trainerId: B, fullName: "Diğer" }).returning({ id: schema.clients.id });
  const zWho = { trainerId: A, clientId: zeynep.id };

  const lesson = async (startsAt: Date, clientId: string, extra: { status?: "scheduled" | "attended"; bookedAgoHours?: number } = {}) => {
    const [l] = await db
      .insert(schema.lessons)
      .values({ trainerId: A, sessionType: "private", startsAt, endsAt: new Date(startsAt.getTime() + H) })
      .returning({ id: schema.lessons.id });
    const [a] = await db
      .insert(schema.lessonAttendees)
      .values({
        trainerId: A,
        lessonId: l.id,
        clientId,
        status: extra.status ?? "scheduled",
        createdAt: new Date(Date.now() - (extra.bookedAgoHours ?? 48) * H),
      })
      .returning({ id: schema.lessonAttendees.id });
    return a.id;
  };

  // ---- Confirmations and reminders ----
  const soon = await lesson(new Date(Date.now() + 20 * H), zeynep.id);
  const tooClose = await lesson(new Date(Date.now() + 1 * H), zeynep.id);
  const farAway = await lesson(new Date(Date.now() + 60 * H), zeynep.id);
  const fresh = await lesson(new Date(Date.now() + 24 * H), ali.id, { bookedAgoHours: 1 });
  const past = await lesson(new Date(Date.now() - 2 * H), ali.id);

  let due = (await owner((tx) => dueReminders(tx))).map((r) => r.attendeeId);
  assert.deepEqual(due, [soon], "only lessons 1–24 h ahead (the default), booked more than 6 h ago");

  assert.equal(await owner((tx) => confirmAttendance(tx, { trainerId: A, clientId: ali.id }, soon)), false, "someone else's booking");
  assert.equal(await owner((tx) => confirmAttendance(tx, { trainerId: B, clientId: zeynep.id }, soon)), false, "wrong trainer");
  assert.equal(await owner((tx) => confirmAttendance(tx, { trainerId: A, clientId: ali.id }, past)), false, "past lessons can't be confirmed");
  assert.equal(await owner((tx) => confirmAttendance(tx, zWho, soon)), true);
  due = (await owner((tx) => dueReminders(tx))).map((r) => r.attendeeId);
  assert.deepEqual(due, [], "a confirmed booking needs no reminder");

  await db.update(schema.lessonAttendees).set({ confirmedAt: null }).where(eq(schema.lessonAttendees.id, soon));
  await owner((tx) => markReminded(tx, [soon]));
  assert.deepEqual(await owner((tx) => dueReminders(tx)), [], "reminded once only");

  // The trainer picks the lead time, or turns reminders off.
  await db.update(schema.trainers).set({ reminderHours: 72 }).where(eq(schema.trainers.id, A));
  assert.deepEqual((await owner((tx) => dueReminders(tx))).map((r) => r.attendeeId), [farAway], "72 h reaches the lesson 60 h ahead");
  await db.update(schema.trainers).set({ remindersEnabled: false }).where(eq(schema.trainers.id, A));
  assert.deepEqual(await owner((tx) => dueReminders(tx)), [], "reminders off");
  await db.update(schema.trainers).set({ remindersEnabled: true, reminderHours: 24 }).where(eq(schema.trainers.id, A));
  await assert.rejects(db.update(schema.trainers).set({ reminderHours: 0 }).where(eq(schema.trainers.id, A)), "lead time stays within 1–72 h");
  void tooClose;
  void farAway;
  void fresh;
  console.log("confirmations and reminder window ok");

  // Tomorrow's list for the trainer (RLS side).
  const tomorrow = addDays(todayISO(TZ), 1);
  const [ty, tm, td] = tomorrow.split("-").map(Number);
  const tomorrowNoon = new Date(Date.UTC(ty, tm - 1, td, 9)); // 12:00 in Istanbul
  const tomorrowOne = await lesson(tomorrowNoon, ali.id);
  const list = await as(A, (tx) => tomorrowAttendees(tx, trainer));
  assert.ok(list.some((t) => t.attendeeId === tomorrowOne && !t.confirmed));
  assert.equal(await as(B, (tx) => tomorrowAttendees(tx, { id: A, timezone: TZ })).then((l) => l.length), 0, "RLS hides another trainer's list");
  assert.equal(whenPhrase(tomorrowNoon, TZ), "yarın 12:00");
  console.log("tomorrow list ok");

  // ---- Lost clients ----
  await lesson(new Date(Date.now() - 30 * 86_400_000), eski.id, { status: "attended" });
  await lesson(new Date(Date.now() - 30 * 86_400_000), zeynep.id, { status: "attended" });
  const lost = await as(A, (tx) => lostClients(tx, trainer));
  assert.deepEqual(
    lost.map((l) => l.name),
    ["Eski Danışan"],
    "Zeynep has upcoming bookings, so she isn't lost",
  );
  console.log("lost clients ok");

  // ---- Renewals ----
  const tpl = await as(A, (tx) =>
    createTemplate(tx, A, {
      name: "4 Ders",
      sessionType: "private",
      sessionCount: 4,
      validityDays: null,
      price: 2000,
      compareAtPrice: null,
      installmentPrice: null,
      installments: 1,
      makeupAllowance: 0,
      isPublic: false,
      isTrial: false,
      description: null,
      features: [],
    }),
  );
  const [pkg] = await db
    .insert(schema.clientPackages)
    .values({ trainerId: A, clientId: zeynep.id, templateId: tpl, name: "4 Ders", sessionType: "private", totalSessions: 2, startsOn: todayISO(TZ), price: "2000.00" })
    .returning({ id: schema.clientPackages.id });
  const renewable = await owner((tx) => renewablePackages(tx, zWho, TZ));
  assert.deepEqual(renewable.map((r) => r.clientPackageId), [pkg.id], "2 lessons left → renewable");
  let cands = await owner((tx) => renewalCandidates(tx));
  assert.deepEqual(cands.map((c) => c.clientPackageId), [pkg.id]);
  await db.update(schema.trainers).set({ renewalOffersEnabled: false }).where(eq(schema.trainers.id, A));
  assert.equal((await owner((tx) => renewalCandidates(tx))).length, 0, "renewal offers off");
  await db.update(schema.trainers).set({ renewalOffersEnabled: true }).where(eq(schema.trainers.id, A));
  await owner((tx) => markRenewalOffered(tx, [pkg.id]));
  cands = await owner((tx) => renewalCandidates(tx));
  assert.equal(cands.length, 0, "offered once per package");
  // A hidden template can be renewed by its owner, not requested by others.
  assert.deepEqual(await owner((tx) => requestPackage(tx, zWho, { templateId: tpl, installments: 1 })), { ok: true, packageName: "4 Ders" });
  assert.deepEqual(await owner((tx) => requestPackage(tx, { trainerId: A, clientId: ali.id }, { templateId: tpl, installments: 1 })), {
    ok: false,
    reason: "not_found",
  });
  console.log("renewal offers ok");

  // ---- Trial lessons: newcomers only ----
  const trial = await as(A, (tx) =>
    createTemplate(tx, A, {
      name: "Deneme dersi",
      sessionType: "private",
      sessionCount: 1,
      validityDays: 14,
      price: 500,
      compareAtPrice: null,
      installmentPrice: null,
      installments: 1,
      makeupAllowance: 0,
      isPublic: true,
      isTrial: true,
      description: null,
      features: [],
    }),
  );
  assert.deepEqual(await owner((tx) => requestPackage(tx, zWho, { templateId: trial, installments: 1 })), { ok: false, reason: "trial" });
  const [yeni] = await db.insert(schema.clients).values({ trainerId: A, fullName: "Yeni Gelen", status: "applicant" }).returning({ id: schema.clients.id });
  const yWho = { trainerId: A, clientId: yeni.id };
  assert.equal((await owner((tx) => requestPackage(tx, yWho, { templateId: trial, installments: 1 }))).ok, true);
  assert.deepEqual(await owner((tx) => requestPackage(tx, yWho, { templateId: trial, installments: 1 })), { ok: false, reason: "already" });
  await db.update(schema.applications).set({ status: "rejected" }).where(eq(schema.applications.clientId, yeni.id));
  assert.deepEqual(
    await owner((tx) => requestPackage(tx, yWho, { templateId: trial, installments: 1 })),
    { ok: false, reason: "trial" },
    "a turned-down trial isn't requested again",
  );
  // Trial packages are never offered for renewal.
  await db
    .insert(schema.clientPackages)
    .values({ trainerId: A, clientId: ali.id, templateId: trial, name: "Deneme", sessionType: "private", totalSessions: 1, startsOn: todayISO(TZ), price: "500.00" });
  assert.equal((await owner((tx) => renewablePackages(tx, { trainerId: A, clientId: ali.id }, TZ))).length, 0);
  // The public sign-up form applies the same rule by phone number.
  const signup = (phone: string) =>
    owner((tx) =>
      recordSignup(tx, A, { fullName: "Form Kişi", phone, email: null, templateId: trial, installments: 1, message: null, healthConsent: false, answers: [] }),
    );
  assert.deepEqual(await signup("905551112233"), { limited: true, trialUsed: true }, "Zeynep already has a package");
  const first = await signup("905554443322");
  assert.equal(first.limited, false, "a new phone can take the trial");
  assert.equal((await signup("905554443322")).limited, false, "a double submit of the same trial is harmless");
  console.log("trial rules ok");

  // ---- Weekly summary ----
  // Monday 2026-09-28 09:00 Istanbul = 06:00 UTC; Monday 07:00 local is too early.
  const early = await owner((tx) => dueWeeklySummaries(tx, new Date("2026-09-28T04:00:00Z")));
  assert.equal(early.length, 0, "not before 08:00 on Monday");
  const monday = await owner((tx) => dueWeeklySummaries(tx, new Date("2026-09-28T06:00:00Z")));
  assert.deepEqual(monday.map((s) => [s.trainerId, s.week]), [[A, "2026-09-28"]], "only onboarded trainers");
  await owner((tx) => markWeeklySent(tx, A, "2026-09-28"));
  assert.equal((await owner((tx) => dueWeeklySummaries(tx, new Date("2026-09-30T06:00:00Z")))).length, 0, "once per week");
  assert.equal((await owner((tx) => dueWeeklySummaries(tx, new Date("2026-10-05T06:00:00Z")))).length, 1, "next Monday again");
  const wed = await owner((tx) => dueWeeklySummaries(tx, new Date("2026-10-07T12:00:00Z")));
  assert.equal(wed[0]?.week, "2026-10-05", "a missed Monday is caught up later in the week");
  void other;
  console.log("weekly summary ok");

  // ---- Ready-made texts ----
  assert.equal(renderTemplate({}, "reminder", { zaman: "yarın 18:00" }), "Yarın 18:00 dersin var. Geliyor musun? Dokunup haber ver.");
  assert.equal(renderTemplate({ missYou: "Selam {ad}, {bilinmeyen} nasılsın?" }, "missYou", { ad: "Zeynep Kaya" }), "Selam Zeynep, {bilinmeyen} nasılsın?");
  assert.equal(renderTemplate({ missYou: "   " }, "missYou", { ad: "Ali" }), "Merhaba Ali, bir süredir görüşemedik. Bu hafta bir ders planlayalım mı? 🙂");
  assert.equal(renderTemplate({ portalInvite: "Sayfan hazır {ad}" }, "portalInvite", { ad: "Ali", link: "https://x/p/1" }), "Sayfan hazır Ali\nhttps://x/p/1");
  assert.deepEqual(cleanTemplates({ missYou: "  Selam {ad}  ", lowBalance: TEMPLATES.lowBalance.text, bogus: "x", paymentDue: "" }), { missYou: "Selam {ad}" });
  console.log("templates ok");

  // ---- Notes and measurements ----
  const zP = { trainerId: A, clientId: zeynep.id };
  const noteId = await as(A, (tx) => addNote(tx, zP, { body: "Diz hassas, derin squat yok", visibleToClient: false }));
  assert.ok(noteId);
  assert.equal(await as(B, (tx) => addNote(tx, { trainerId: B, clientId: zeynep.id }, { body: "x", visibleToClient: true })), null, "not another trainer's client");
  await as(A, (tx) => addNote(tx, zP, { body: "Harika ilerliyorsun!", visibleToClient: true }));
  assert.equal((await as(A, (tx) => listNotes(tx, zeynep.id))).length, 2);
  assert.deepEqual((await owner((tx) => listNotes(tx, zeynep.id, { visibleOnly: true }))).map((n) => n.body), ["Harika ilerliyorsun!"], "the client sees shared notes only");
  assert.equal((await as(B, (tx) => listNotes(tx, zeynep.id))).length, 0, "RLS hides notes");
  assert.equal(await as(B, (tx) => setNoteVisibility(tx, B, noteId!, true)), null);
  assert.equal(cleanNote("   "), null);

  const day = todayISO(TZ);
  assert.deepEqual(await as(A, (tx) => saveMeasurements(tx, zP, day, [{ metric: "weight", value: 64.5 }])), { ok: false, reason: "consent" }, "no consent, no health data");
  await as(A, (tx) => grantHealthConsent(tx, zP));
  await as(A, (tx) => grantHealthConsent(tx, zP));
  assert.equal(
    (await db.select().from(schema.consents).where(eq(schema.consents.clientId, zeynep.id))).filter((c) => c.kind === "health_data").length,
    1,
    "consent recorded once",
  );
  assert.deepEqual(await as(A, (tx) => saveMeasurements(tx, zP, addDays(day, -14), [{ metric: "weight", value: 66 }, { metric: "waist", value: 80 }])), { ok: true, saved: 2 });
  await as(A, (tx) => saveMeasurements(tx, zP, day, [{ metric: "weight", value: 64.5 }]));
  // Same day again replaces the value (the client logging her own weight).
  await owner((tx) => saveMeasurements(tx, zP, day, [{ metric: "weight", value: 64.2 }], "client"));
  const rows = await as(A, (tx) => listMeasurements(tx, zeynep.id));
  assert.deepEqual(
    rows.filter((r) => r.metric === "weight").map((r) => [r.value, r.source]),
    [
      [66, "trainer"],
      [64.2, "client"],
    ],
  );
  assert.equal((await as(B, (tx) => listMeasurements(tx, zeynep.id))).length, 0, "RLS hides measurements");
  const series = toSeries(rows, []);
  assert.deepEqual(series.map((x) => x.metric.key), ["weight", "waist"]);
  const change = seriesChange(series[0].points)!;
  assert.equal(Math.round(change.delta * 10) / 10, -1.8);
  assert.equal(change.days, 14);
  assert.equal(spanPhrase(change.days), "2 haftada");
  const prog = await owner((tx) => portalProgress(tx, zP));
  assert.equal(prog.consented, true);
  assert.equal(prog.selfWeigh, true);
  assert.deepEqual(prog.notes.map((n) => n.body), ["Harika ilerliyorsun!"]);
  assert.equal(await as(A, (tx) => deleteMeasurements(tx, zP, addDays(day, -14))), 2);

  assert.deepEqual(parseMetricValue("72,5", BUILTIN_METRICS[0]), { value: 72.5 });
  assert.deepEqual(parseMetricValue("", BUILTIN_METRICS[0]), { value: null });
  assert.ok("error" in parseMetricValue("750", BUILTIN_METRICS[0]), "out of range");
  assert.equal(formatMetric(-1.8, { unit: "kg", decimals: 1 }, { sign: true }), "−1,8 kg");
  assert.deepEqual(activeMetrics(null, "pilates", []).map((m) => m.key), ["weight", "waist", "flexibility", "pain"]);
  assert.deepEqual(activeMetrics(["waist", "c1"], "pt", [{ id: "c1", label: "Plank", unit: "sn", decimals: 0 }]).map((m) => m.label), ["Bel", "Plank"]);
  console.log("notes and measurements ok");

  // ---- Notification choices ----
  assert.equal(trainerWants({}, "application", "email"), true, "new applications e-mail by default");
  assert.equal(trainerWants({}, "booking", "email"), false, "bookings are push only by default");
  assert.equal(trainerWants({ message: { email: true } }, "message", "email"), false, "messages never go by e-mail");
  assert.equal(clientWants({ reminder: { email: true } }, "reminder", "email"), false, "reminders never go by e-mail");
  assert.equal(clientWants({ reminder: { push: false } }, "reminder", "push"), false);
  assert.deepEqual(cleanPrefs("client", { reminder: { push: false, email: true }, message: { push: true, email: true }, bogus: { push: true } }), {
    reminder: { push: false },
    message: { push: true },
  });
  assert.equal(notifyPrefsSchema.safeParse({ a: { push: "yes" } }).success, false);
  const [stored] = await db.select({ p: schema.clients.notifyPrefs }).from(schema.clients).where(eq(schema.clients.id, zeynep.id));
  assert.deepEqual(stored.p, {}, "new rows start with defaults");
  await db.update(schema.clients).set({ notifyPrefs: { reminder: { push: false } } }).where(eq(schema.clients.id, zeynep.id));
  const [after] = await db.select({ p: schema.clients.notifyPrefs }).from(schema.clients).where(eq(schema.clients.id, zeynep.id));
  assert.equal(clientWants(after.p, "reminder", "push"), false);
  console.log("notification choices ok");

  // ---- Owner metrics (/yonetim) ----
  const o = await owner((tx) => overview(tx));
  assert.equal(o.trainers, 2);
  assert.equal(o.onboarded, 1);
  assert.ok(o.clients >= 3);
  assert.equal(o.active_trainers_7, 0, "attendance marked on lessons in the last week counts; the 30-day-old ones don't");
  const act = await owner((tx) => activation(tx));
  assert.equal(act.package, 1);
  assert.equal(act.attendance, 1);
  const weeks = await owner((tx) => weekly(tx, 8));
  assert.equal(weeks.length, 8);
  assert.ok(weeks.every((w) => /^\d{4}-\d{2}-\d{2}$/.test(w.week)));
  assert.equal(weeks.at(-1)!.newTrainers, 2, "both test trainers signed up this week");
  const trainersSeen = await owner((tx) => trainerList(tx));
  assert.equal(trainersSeen.length, 2);
  assert.ok(trainersSeen.find((t) => t.id === A)?.onboarded);
  assert.ok(trainersSeen.every((t) => !("phone" in t)), "no client contact details");
  console.log("owner metrics ok");

  // The browser's phone pattern accepts exactly what the server normalises.
  const phone = new RegExp(`^(?:${PHONE_PATTERN})$`, "v");
  for (const sample of ["0532 123 45 67", "+90 532 123 45 67", "905321234567", "5321234567", "0 (532) 123-45-67", "123", "abc", "", "0532", "+1 415 555 0100"]) {
    assert.equal(phone.test(sample), normalizePhone(sample) !== null, `phone pattern vs normalizePhone: ${JSON.stringify(sample)}`);
  }
  console.log("phone pattern ok\n\nall engagement checks passed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
