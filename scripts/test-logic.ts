// Runs the real package/lesson/attendance functions against PGlite, as a
// signed-in trainer with RLS on. Run with: pnpm test:logic
import assert from "node:assert/strict";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import type { Tx } from "../src/db";
import {
  cancelLessons,
  createLessons,
  findConflicts,
  getLesson,
  getLessons,
  lessonDates,
  listClientOptions,
  rescheduleLesson,
  restoreLesson,
  setAttendance,
} from "../src/db/lessons";
import { layoutDay } from "../src/app/(app)/takvim/lesson-summary";
import { approveApplication, countPendingApplications, rejectApplication } from "../src/db/applications";
import { createIntakeField, ensureDefaultIntakeFields, listIntakeFields, toDef, updateIntakeField } from "../src/db/intake";
import { DEFAULT_INTAKE_FIELDS, answerName, formatAnswer, parseAnswer } from "../src/lib/intake";
import { recordSignup, validateSignup } from "../src/lib/signup-core";
import { recurringDates, startOfWeek } from "../src/lib/dates";
import { isUniqueViolation } from "../src/lib/pg-errors";
import { slugError, toSlug } from "../src/lib/slug";
import { expiryFor, pickPackage, sellPackage } from "../src/db/packages";
import { deletePayment, listDebtors, listRecentPayments, recordPayment } from "../src/db/payments";
import {
  PORTAL_TOKEN_PATTERN,
  createPortalLink,
  getActivePortalLink,
  getActivePortalTokens,
  hashToken,
  revokePortalLinks,
  tokenFor,
} from "../src/db/portal";
import * as schema from "../src/db/schema";
import { addUsers, createTestDb } from "./pglite";

const T = "00000000-0000-0000-0000-0000000000a1";
process.env.PORTAL_SECRET ??= "test-secret-test-secret-test-secret";
const trainer = { id: T, timezone: "Europe/Istanbul" };

async function main() {
  const pg = await createTestDb();
  await addUsers(pg, [{ id: T, name: "Test Hoca" }]);
  const db = drizzle(pg, { schema });

  // Same shape as withTrainer(): a transaction running as `authenticated`.
  const asTrainer = <R>(fn: (tx: Tx) => Promise<R>) =>
    db.transaction(async (tx) => {
      await tx.execute(sql`select set_config('request.jwt.claim.sub', ${T}, true)`);
      await tx.execute(sql`set local role authenticated`);
      return fn(tx as unknown as Tx);
    });

  const balance = (packageId: string) =>
    asTrainer(async (tx) => {
      const [row] = await tx
        .select()
        .from(schema.clientPackageBalances)
        .where(eq(schema.clientPackageBalances.clientPackageId, packageId));
      return row;
    });

  assert.equal(expiryFor("2026-10-01", 30), "2026-10-30");
  assert.equal(expiryFor("2026-02-01", 28), "2026-02-28");
  assert.equal(expiryFor("2026-10-01", null), null);

  const [zeynep, ali] = await asTrainer(async (tx) =>
    tx
      .insert(schema.clients)
      .values([
        { trainerId: T, fullName: "Zeynep" },
        { trainerId: T, fullName: "Ali" },
      ])
      .returning({ id: schema.clients.id }),
  );

  // Two packages: the one expiring first must be used first.
  const older = await asTrainer((tx) =>
    sellPackage(tx, T, {
      clientId: zeynep.id,
      templateId: null,
      name: "4 Ders Özel",
      sessionType: "private",
      totalSessions: 2,
      startsOn: "2026-09-01",
      expiresOn: expiryFor("2026-09-01", 120),
      price: 2000,
      makeupAllowance: 1,
      payment: { amount: 500, method: "cash" },
    }),
  );
  const newer = await asTrainer((tx) =>
    sellPackage(tx, T, {
      clientId: zeynep.id,
      templateId: null,
      name: "8 Ders Özel",
      sessionType: "private",
      totalSessions: 8,
      startsOn: "2026-09-20",
      expiresOn: null,
      price: 4000,
      makeupAllowance: 0,
      payment: null,
    }),
  );
  let b = await balance(older);
  assert.equal(String(b.paidAmount), "500.00");
  assert.equal(String(b.dueAmount), "1500.00");
  console.log("sell: payment recorded, due computed");

  assert.equal(await asTrainer((tx) => pickPackage(tx, zeynep.id, "private")), older, "soonest-expiring first");
  assert.equal(await asTrainer((tx) => pickPackage(tx, ali.id, "private")), null, "no package → null");

  // Lesson in the trainer's timezone: 10:00 Istanbul = 07:00 UTC.
  const lessonId = await asTrainer((tx) =>
    createLessons(tx, trainer, {
      repeat: null,
      date: "2026-10-05",
      time: "10:00",
      durationMinutes: 50,
      sessionType: "duet",
      clientIds: [zeynep.id, ali.id],
      status: "scheduled",
      note: null,
    }),
  );
  const [lesson] = await asTrainer((tx) => tx.select().from(schema.lessons).where(eq(schema.lessons.id, lessonId)));
  assert.equal(lesson.startsAt.toISOString(), "2026-10-05T07:00:00.000Z");
  assert.equal(lesson.endsAt.toISOString(), "2026-10-05T07:50:00.000Z");
  console.log("lesson: wall-clock time converted from trainer timezone");

  const attendees = await asTrainer((tx) =>
    tx.select().from(schema.lessonAttendees).where(eq(schema.lessonAttendees.lessonId, lessonId)),
  );
  const zAtt = attendees.find((a) => a.clientId === zeynep.id)!;
  const aAtt = attendees.find((a) => a.clientId === ali.id)!;
  // Duet lesson, but Zeynep only has private packages: falls back to one of them.
  assert.equal(zAtt.clientPackageId, older);
  assert.equal(aAtt.clientPackageId, null);

  // A booked lesson reserves a credit: with 2 total and 1 booked, the next
  // booking still fits the older package, the third moves to the newer one.
  const second = await asTrainer((tx) =>
    createLessons(tx, trainer, {
      repeat: null,
      date: "2026-10-06",
      time: "10:00",
      durationMinutes: 50,
      sessionType: "private",
      clientIds: [zeynep.id],
      status: "attended",
      note: null,
    }),
  );
  const third = await asTrainer((tx) =>
    createLessons(tx, trainer, {
      repeat: null,
      date: "2026-10-07",
      time: "10:00",
      durationMinutes: 50,
      sessionType: "private",
      clientIds: [zeynep.id],
      status: "scheduled",
      note: null,
    }),
  );
  const pkgOf = async (lid: string) =>
    (
      await asTrainer((tx) =>
        tx.select().from(schema.lessonAttendees).where(eq(schema.lessonAttendees.lessonId, lid)),
      )
    )[0];
  assert.equal((await pkgOf(second)).clientPackageId, older);
  assert.equal((await pkgOf(third)).clientPackageId, newer, "older package full → newer one");
  b = await balance(older);
  assert.equal(b.usedSessions, 1, "logged-as-attended lesson consumed a credit");
  console.log("package picking: expiry order and booked credits respected");

  // Late cancel with a makeup left → forgiven; the next one burns.
  let r = await asTrainer((tx) => setAttendance(tx, T, zAtt.id, "late_cancel"));
  assert.deepEqual(r, { status: "late_cancel", makeupUsed: true, remaining: 1 });
  // Re-marking the same attendee keeps its own makeup (not counted twice).
  r = await asTrainer((tx) => setAttendance(tx, T, zAtt.id, "late_cancel"));
  assert.equal(r?.makeupUsed, true);

  const fourth = await asTrainer((tx) =>
    createLessons(tx, trainer, {
      repeat: null,
      date: "2026-10-08",
      time: "10:00",
      durationMinutes: 50,
      sessionType: "private",
      clientIds: [zeynep.id],
      status: "scheduled",
      note: null,
    }),
  );
  // Put the fourth lesson on the older package to exhaust its only makeup.
  const fourthAtt = await pkgOf(fourth);
  await asTrainer((tx) =>
    tx
      .update(schema.lessonAttendees)
      .set({ clientPackageId: older })
      .where(eq(schema.lessonAttendees.id, fourthAtt.id)),
  );
  r = await asTrainer((tx) => setAttendance(tx, T, fourthAtt.id, "late_cancel"));
  assert.equal(r?.makeupUsed, false, "allowance used up → lesson burns");
  assert.equal(r?.remaining, 0);
  console.log("late cancel: makeup applied once, then burns");

  // Undo: back to scheduled gives the credit back and frees the makeup.
  r = await asTrainer((tx) => setAttendance(tx, T, zAtt.id, "scheduled"));
  assert.deepEqual(r, { status: "scheduled", makeupUsed: false, remaining: 0 });
  r = await asTrainer((tx) => setAttendance(tx, T, zAtt.id, "attended"));
  assert.equal(r?.remaining, 0);
  b = await balance(older);
  assert.equal(b.state, "finished");
  console.log("undo and finish: balances follow attendance");

  // Payments. "older" (2000, 500 paid) is finished but still owes 1500.
  let pay = await asTrainer((tx) =>
    recordPayment(tx, T, {
      clientId: zeynep.id,
      clientPackageId: older,
      amount: 1600,
      method: "cash",
      paidOn: "2026-10-01",
      note: null,
    }),
  );
  assert.deepEqual(pay, { ok: false, reason: "overpay", due: 1500 });
  // Paying into another client's package is refused, not a crash.
  pay = await asTrainer((tx) =>
    recordPayment(tx, T, { clientId: ali.id, clientPackageId: older, amount: 10, method: "cash", paidOn: "2026-10-01", note: null }),
  );
  assert.deepEqual(pay, { ok: false, reason: "package_not_found" });

  let debtors = await asTrainer((tx) => listDebtors(tx, T));
  assert.equal(debtors.length, 1);
  assert.equal(debtors[0].total, 5500, "finished package's debt (1500) + unpaid newer package (4000)");
  assert.equal(debtors[0].packages.length, 2);

  pay = await asTrainer((tx) =>
    recordPayment(tx, T, { clientId: zeynep.id, clientPackageId: older, amount: 1500, method: "card", paidOn: "2026-10-01", note: null }),
  );
  assert.deepEqual(pay, { ok: true });
  debtors = await asTrainer((tx) => listDebtors(tx, T));
  assert.equal(debtors[0].total, 4000);
  assert.deepEqual(
    debtors[0].packages.map((p) => p.id),
    [newer],
    "fully paid package drops off",
  );

  // A package sold without a price accepts any amount; so does a payment with no package.
  const free = await asTrainer((tx) =>
    sellPackage(tx, T, {
      clientId: ali.id,
      templateId: null,
      name: "Deneme",
      sessionType: "private",
      totalSessions: 1,
      startsOn: "2026-10-01",
      expiresOn: null,
      price: 0,
      makeupAllowance: 0,
      payment: null,
    }),
  );
  assert.deepEqual(
    await asTrainer((tx) =>
      recordPayment(tx, T, { clientId: ali.id, clientPackageId: free, amount: 300, method: "cash", paidOn: "2026-10-02", note: null }),
    ),
    { ok: true },
  );
  assert.deepEqual(
    await asTrainer((tx) =>
      recordPayment(tx, T, { clientId: ali.id, clientPackageId: null, amount: 750, method: "bank_transfer", paidOn: "2026-10-02", note: "tek ders" }),
    ),
    { ok: true },
  );
  const recent = await asTrainer((tx) => listRecentPayments(tx, T, { clientId: ali.id }));
  assert.deepEqual(
    recent.map((p) => String(p.amount)).sort(),
    ["300.00", "750.00"],
  );
  console.log("payments: overpay blocked, debts follow payments, unpriced and package-less payments allowed");

  // ---- Calendar: series, conflicts, cancel/restore, reschedule ----
  assert.deepEqual(recurringDates("2026-10-05", "2026-10-18", [2, 4]), ["2026-10-06", "2026-10-08", "2026-10-13", "2026-10-15"]);
  assert.equal(startOfWeek("2026-10-04"), "2026-09-28", "Sunday belongs to the week starting Monday");
  assert.deepEqual(
    lessonDates({ date: "2026-10-06", repeat: { weekdays: [2, 4], weeks: 2 } }),
    ["2026-10-06", "2026-10-08", "2026-10-13", "2026-10-15"],
  );

  const [mert] = await asTrainer((tx) =>
    tx.insert(schema.clients).values({ trainerId: T, fullName: "Mert" }).returning({ id: schema.clients.id }),
  );
  const mertPkg = await asTrainer((tx) =>
    sellPackage(tx, T, {
      clientId: mert.id,
      templateId: null,
      name: "3 Ders",
      sessionType: "private",
      totalSessions: 3,
      startsOn: "2026-11-01",
      expiresOn: null,
      price: 0,
      makeupAllowance: 0,
      payment: null,
    }),
  );
  const series = {
    date: "2026-11-03", // Tuesday
    time: "18:00",
    durationMinutes: 60,
    sessionType: "private" as const,
    clientIds: [mert.id],
    status: "scheduled" as const,
    note: null,
    repeat: { weekdays: [2, 4], weeks: 2 },
  };
  const firstOfSeries = await asTrainer((tx) => createLessons(tx, trainer, series));
  const mertLessons = await asTrainer((tx) => getLessons(tx, trainer, { from: "2026-11-01", to: "2026-11-30" }));
  const mine = mertLessons.filter((l) => l.attendees.some((a) => a.clientId === mert.id));
  assert.deepEqual(
    mine.map((l) => `${l.localDate} ${l.startMinute}`),
    ["2026-11-03 1080", "2026-11-05 1080", "2026-11-10 1080", "2026-11-12 1080"],
    "4 occurrences at 18:00 local",
  );
  assert.ok(mine.every((l) => l.seriesId && l.seriesId === mine[0].seriesId), "all share one series");
  // 3-lesson package: the first three occurrences draw from it, the fourth has no package.
  assert.deepEqual(
    mine.map((l) => (l.attendees[0].remaining === null ? "none" : "pkg")),
    ["pkg", "pkg", "pkg", "none"],
  );
  console.log("series: weekly occurrences created, package credits reserved in order");

  // Conflicts: 18:30 on the 5th overlaps; 19:00 (back-to-back) does not.
  let conflicts = await asTrainer((tx) =>
    findConflicts(tx, trainer, { dates: ["2026-11-05", "2026-11-06"], time: "18:30", durationMinutes: 60 }),
  );
  assert.deepEqual(conflicts.map((c) => c.date), ["2026-11-05"]);
  assert.equal(conflicts[0].names, "Mert");
  conflicts = await asTrainer((tx) => findConflicts(tx, trainer, { dates: ["2026-11-05"], time: "19:00", durationMinutes: 60 }));
  assert.equal(conflicts.length, 0, "back-to-back is fine");
  conflicts = await asTrainer((tx) =>
    findConflicts(tx, trainer, { dates: ["2026-11-03"], time: "18:15", durationMinutes: 30, excludeLessonId: firstOfSeries }),
  );
  assert.equal(conflicts.length, 0, "a lesson doesn't conflict with itself when moved");
  console.log("conflicts: overlap detected in trainer timezone, edges and self excluded");

  // Cancel the second occurrence and everything after: reserved credits are released.
  const second2 = mine[1].lessonId;
  assert.equal(await asTrainer((tx) => cancelLessons(tx, T, second2, { following: true })), 3);
  let bal = await balance(mertPkg);
  assert.equal(bal.scheduledSessions, 1, "only the first occurrence still holds a credit");
  assert.equal(bal.remainingSessions, 3, "trainer-side cancel burns nothing");
  const cancelledNow = await asTrainer((tx) => getLessons(tx, trainer, { from: "2026-11-01", to: "2026-11-30" }));
  assert.equal(cancelledNow.filter((l) => l.attendees.some((a) => a.clientId === mert.id)).length, 1, "hidden unless includeCancelled");

  assert.equal(await asTrainer((tx) => restoreLesson(tx, T, second2)), true);
  bal = await balance(mertPkg);
  assert.equal(bal.scheduledSessions, 2);
  console.log("cancel following + restore: credits released and re-reserved");

  // Reschedule the first occurrence to 09:30 local next day.
  assert.equal(
    await asTrainer((tx) => rescheduleLesson(tx, trainer, firstOfSeries, { date: "2026-11-04", time: "09:30", durationMinutes: 45 })),
    true,
  );
  const moved = await asTrainer((tx) => getLesson(tx, trainer, firstOfSeries));
  assert.deepEqual([moved?.localDate, moved?.startMinute, moved?.durationMinutes], ["2026-11-04", 570, 45]);
  console.log("reschedule: moved in local time");

  // Overlapping lessons get side-by-side lanes.
  const fake = (id: string, start: number, dur: number) =>
    ({ lessonId: id, startMinute: start, durationMinutes: dur }) as Parameters<typeof layoutDay>[0][number];
  const lanes = layoutDay([fake("a", 600, 60), fake("b", 630, 60), fake("c", 720, 30)]);
  assert.deepEqual(
    lanes.map((p) => [p.lesson.lessonId, p.lane, p.lanes]),
    [
      ["a", 0, 2],
      ["b", 1, 2],
      ["c", 0, 1],
    ],
  );

  // ---- Portal links ----
  const link = await asTrainer((tx) => createPortalLink(tx, T, zeynep.id));
  assert.match(link.token, PORTAL_TOKEN_PATTERN);
  assert.equal(link.token, tokenFor(link.id), "token is derived from the id");
  assert.notEqual(tokenFor(link.id, "x".repeat(32)), link.token, "a different secret gives a different token");
  const [stored] = await asTrainer((tx) =>
    tx.select().from(schema.portalTokens).where(eq(schema.portalTokens.id, link.id)),
  );
  assert.equal(stored.tokenHash, hashToken(link.token));
  assert.ok(!Object.values(stored).includes(link.token), "the token itself is never stored");
  assert.equal((await asTrainer((tx) => getActivePortalLink(tx, zeynep.id)))?.token, link.token, "same link can be shown again");

  const renewed = await asTrainer((tx) => createPortalLink(tx, T, zeynep.id));
  assert.notEqual(renewed.token, link.token);
  const [old] = await asTrainer((tx) =>
    tx.select().from(schema.portalTokens).where(eq(schema.portalTokens.id, link.id)),
  );
  assert.ok(old.revokedAt, "renewing revokes the old link");
  const tokens = await asTrainer((tx) => getActivePortalTokens(tx, [zeynep.id, ali.id]));
  assert.deepEqual([...tokens.entries()], [[zeynep.id, renewed.token]]);
  await asTrainer((tx) => revokePortalLinks(tx, zeynep.id));
  assert.equal(await asTrainer((tx) => getActivePortalLink(tx, zeynep.id)), null);
  console.log("portal links: derived, hashed at rest, re-showable, renew/revoke work");

  // ---- Intake questions and public sign-up ----
  const num = { type: "number" as const, min: 100, max: 230, options: [], unit: "cm" };
  assert.deepEqual(parseAnswer(num, ["172,5"]), { value: { kind: "number", number: 172.5 } });
  assert.deepEqual(parseAnswer(num, ["90"]), { error: "En az 100 cm olmalı." });
  assert.deepEqual(parseAnswer(num, [""]), { value: null });
  const multi = { type: "multi_choice" as const, min: null, max: null, unit: null, options: ["Sabah", "Öğle", "Akşam"] };
  assert.deepEqual(parseAnswer(multi, ["Akşam", "Sabah", "Akşam"]), { value: { kind: "options", options: ["Sabah", "Akşam"] } });
  assert.ok("error" in parseAnswer(multi, ["Gece"]));
  assert.deepEqual(parseAnswer({ ...multi, type: "yes_no" }, ["yes"]), { value: { kind: "bool", bool: true } });
  assert.equal(formatAnswer({ type: "number", unit: "kg", valueNumber: "62.5", valueText: null, valueDate: null, valueOptions: null, valueBool: null }), "62,5 kg");

  await asTrainer((tx) => ensureDefaultIntakeFields(tx, T));
  await asTrainer((tx) => ensureDefaultIntakeFields(tx, T));
  let fields = await asTrainer((tx) => listIntakeFields(tx, T, { activeOnly: true }));
  assert.equal(fields.length, DEFAULT_INTAKE_FIELDS.length, "defaults seeded once");
  // Make "Kilo" (a health question) required, and add a required non-health one.
  const kilo = fields.find((f) => f.label === "Kilo")!;
  await asTrainer((tx) => updateIntakeField(tx, T, kilo.id, { ...toDef(kilo), required: true }));
  await asTrainer((tx) =>
    createIntakeField(tx, T, { label: "Meslek", type: "short_text", helpText: null, unit: null, min: null, max: null, options: [], required: true, isHealth: false }),
  );
  fields = await asTrainer((tx) => listIntakeFields(tx, T, { activeOnly: true }));
  const byLabel = (l: string) => fields.find((f) => f.label === l)!;

  const [tpl] = await asTrainer((tx) =>
    tx
      .insert(schema.packageTemplates)
      .values({ trainerId: T, name: "8 Ders Özel", sessionType: "private", sessionCount: 8, validityDays: 35, price: "4000", makeupAllowance: 1 })
      .returning({ id: schema.packageTemplates.id }),
  );
  const form = { trainerId: T, packageIds: [tpl.id], fields };
  const fd = (entries: [string, string][]) => {
    const f = new FormData();
    for (const [k, v] of entries) f.append(k, v);
    return f;
  };
  const base: [string, string][] = [
    ["firstName", "Deniz"],
    ["lastName", "Yıldız"],
    ["phone", "0555 111 22 33"],
    ["email", "Deniz@Example.com"],
    ["templateId", tpl.id],
    ["kvkk", "on"],
    [answerName(byLabel("Meslek").id), "Mimar"],
  ];

  // Missing required non-health answer → error; missing required health answer without consent → fine.
  let v = validateSignup(form, fd(base.filter(([k]) => k !== answerName(byLabel("Meslek").id))));
  assert.ok("errors" in v && v.errors[answerName(byLabel("Meslek").id)] === "Bu alan zorunlu.");
  v = validateSignup(form, fd(base));
  assert.ok("data" in v, "health questions are optional without consent");
  // With consent, the required health question is enforced and health answers are kept.
  v = validateSignup(form, fd([...base, ["healthConsent", "on"]]));
  assert.ok("errors" in v && v.errors[answerName(kilo.id)] === "Bu alan zorunlu.");
  // Health answers sent without consent are dropped, not stored.
  v = validateSignup(form, fd([...base, [answerName(kilo.id), "61"], [answerName(byLabel("Boy").id), "168"]]));
  assert.ok("data" in v && v.data.answers.every((a) => !a.field.isHealth));
  assert.equal("errors" in validateSignup(form, fd([...base, ["website", "spam"]])), true, "honeypot");
  assert.equal("errors" in validateSignup(form, fd(base.filter(([k]) => k !== "kvkk"))), true, "KVKK notice is required");

  v = validateSignup(form, fd([...base, ["healthConsent", "on"], [answerName(kilo.id), "61,5"], [answerName(byLabel("Boy").id), "168"]]));
  assert.ok("data" in v);
  assert.equal(v.data.email, "deniz@example.com");
  const signupData = v.data;

  // recordSignup runs as the database owner, like adminDb on the public page.
  const first = await db.transaction((tx) => recordSignup(tx as unknown as Tx, T, signupData));
  assert.equal(first.limited, false);
  const again = await db.transaction((tx) => recordSignup(tx as unknown as Tx, T, signupData));
  assert.deepEqual(again, first, "double submit → same link, no second application");
  const [applicant] = await db.select().from(schema.clients).where(eq(schema.clients.phone, "905551112233"));
  assert.deepEqual([applicant.status, applicant.source, applicant.fullName], ["applicant", "public_page", "Deniz Yıldız"]);
  const apps = await db.select().from(schema.applications).where(eq(schema.applications.clientId, applicant.id));
  assert.equal(apps.length, 1);
  const storedAnswers = await db.select().from(schema.intakeAnswers).where(eq(schema.intakeAnswers.clientId, applicant.id));
  assert.deepEqual(
    storedAnswers.map((a) => [a.label, formatAnswer(a)]).sort(),
    [["Boy", "168 cm"], ["Kilo", "61,5 kg"], ["Meslek", "Mimar"]],
  );
  const storedConsents = await db.select({ kind: schema.consents.kind }).from(schema.consents).where(eq(schema.consents.clientId, applicant.id));
  assert.deepEqual(storedConsents.map((c) => c.kind).sort(), ["health_data", "kvkk_notice"]);
  // Applicants don't appear in the client list yet.
  assert.ok(!(await asTrainer((tx) => listClientOptions(tx, T))).some((c) => c.id === applicant.id));
  assert.equal(await asTrainer((tx) => countPendingApplications(tx, T)), 1);
  console.log("sign-up: answers validated per type, consent gates health data, applicant + application stored once");

  // Approve → active client with the template's package from the chosen start date.
  const approved = await asTrainer((tx) => approveApplication(tx, trainer, apps[0].id, { startsOn: "2026-10-01" }));
  assert.ok(approved);
  const [ap] = await asTrainer((tx) => tx.select().from(schema.clientPackages).where(eq(schema.clientPackages.id, approved.clientPackageId)));
  assert.deepEqual([ap.name, ap.totalSessions, ap.expiresOn, ap.price], ["8 Ders Özel", 8, "2026-11-04", "4000.00"]);
  assert.equal(await asTrainer((tx) => approveApplication(tx, trainer, apps[0].id, { startsOn: "2026-10-01" })), null, "only once");
  const [nowActive] = await db.select({ status: schema.clients.status }).from(schema.clients).where(eq(schema.clients.id, applicant.id));
  assert.equal(nowActive.status, "active");

  // Same phone signing up again (now an existing client) reuses the record.
  const repeatSignup = await db.transaction((tx) => recordSignup(tx as unknown as Tx, T, { ...signupData, answers: [] }));
  assert.equal(repeatSignup.limited, false);
  assert.equal((await db.select().from(schema.clients).where(eq(schema.clients.phone, "905551112233"))).length, 1);

  // A stranger who gets rejected is archived, and signing up again brings the same record back.
  const strangerData = { ...signupData, phone: "905559998877", fullName: "Test Kişi", email: null, answers: [] };
  await db.transaction((tx) => recordSignup(tx as unknown as Tx, T, strangerData));
  const [stranger] = await db.select().from(schema.clients).where(eq(schema.clients.phone, "905559998877"));
  const [strangerApp] = await db.select().from(schema.applications).where(eq(schema.applications.clientId, stranger.id));
  await asTrainer((tx) => rejectApplication(tx, T, strangerApp.id));
  const [archived] = await db.select({ archivedAt: schema.clients.archivedAt }).from(schema.clients).where(eq(schema.clients.id, stranger.id));
  assert.ok(archived.archivedAt, "rejected applicant archived");

  const moreTemplates = await asTrainer((tx) =>
    tx
      .insert(schema.packageTemplates)
      .values(["A", "B", "C"].map((n) => ({ trainerId: T, name: `Paket ${n}`, sessionType: "private" as const, sessionCount: 4 })))
      .returning({ id: schema.packageTemplates.id }),
  );
  const tryWith = (templateId: string) => db.transaction((tx) => recordSignup(tx as unknown as Tx, T, { ...strangerData, templateId }));
  assert.equal((await tryWith(moreTemplates[0].id)).limited, false);
  const strangers = await db.select().from(schema.clients).where(eq(schema.clients.phone, "905559998877"));
  assert.deepEqual([strangers.length, strangers[0].id, strangers[0].archivedAt], [1, stranger.id, null], "same record, unarchived");
  assert.equal((await tryWith(moreTemplates[1].id)).limited, false, "3rd application in 24h still allowed");
  assert.equal((await tryWith(moreTemplates[2].id)).limited, true, "4th application from one phone in 24h is refused");
  console.log("approve/reject: package created from template, applicants archived on rejection, rate limit applies");

  // ---- Public page slugs ----
  assert.equal(toSlug("Çağla Işık Öztürk"), "cagla-isik-ozturk");
  assert.equal(toSlug("İREM ŞEN Pilates"), "irem-sen-pilates");
  assert.equal(slugError("bugun"), "Bu adres kullanılamıyor.");
  assert.ok(slugError("ab"));
  assert.equal(slugError("samed-hoca"), null);
  await asTrainer((tx) => tx.update(schema.trainers).set({ slug: "samed-hoca" }).where(eq(schema.trainers.id, T)));
  const otherId = "00000000-0000-0000-0000-0000000000b2";
  await addUsers(pg, [{ id: otherId }]);
  const taken = await db
    .transaction(async (tx) => {
      await tx.execute(sql`select set_config('request.jwt.claim.sub', ${otherId}, true)`);
      await tx.execute(sql`set local role authenticated`);
      await tx.update(schema.trainers).set({ slug: "samed-hoca" }).where(eq(schema.trainers.id, otherId));
    })
    .then(() => null, (e) => e);
  assert.ok(isUniqueViolation(taken), "a second trainer can't take the same slug");
  await assert.rejects(
    asTrainer((tx) => tx.update(schema.trainers).set({ slug: "Büyük Harf" }).where(eq(schema.trainers.id, T))),
    "database rejects malformed slugs",
  );
  console.log("slugs: Turkish transliteration, reserved words, uniqueness, format check");

  // Another trainer's attendee id is invisible (RLS) → null, nothing changed.
  const other = await db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true)`);
    await tx.execute(sql`set local role authenticated`);
    return setAttendance(tx as unknown as Tx, "00000000-0000-0000-0000-0000000000b2", aAtt.id, "attended");
  });
  assert.equal(other, null);
  const [someone] = await asTrainer((tx) => listRecentPayments(tx, T, { limit: 1 }));
  const deletedByOther = await db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true)`);
    await tx.execute(sql`set local role authenticated`);
    return deletePayment(tx as unknown as Tx, "00000000-0000-0000-0000-0000000000b2", someone.id);
  });
  assert.equal(deletedByOther, null);
  await assert.rejects(
    db.transaction(async (tx) => {
      await tx.execute(sql`select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true)`);
      await tx.execute(sql`set local role authenticated`);
      return createPortalLink(tx as unknown as Tx, "00000000-0000-0000-0000-0000000000b2", zeynep.id);
    }),
    "another trainer cannot open a portal link for my client",
  );
  assert.ok(await asTrainer((tx) => deletePayment(tx, T, someone.id)), "owner can delete");
  console.log("cross-tenant attendance and payment delete blocked\n\nall logic checks passed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
