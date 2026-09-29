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
import { bookSlot, cancelBooking, getBookingView, replaceAvailabilityRules, upcomingForClient } from "../src/db/booking";
import { computeSlots, toHHMM } from "../src/lib/slots";
import {
  addAttendee,
  addGroupMember,
  createGroupClass,
  endGroupClass,
  ensureGroupOccurrences,
  getGroupView,
  joinGroupLesson,
  removeGroupMember,
  updateGroupClass,
} from "../src/db/groups";
import { archiveClient, countUpcomingLessons, deleteClient, listArchivedClients, restoreClient } from "../src/db/clients";
import { approveApplication, countPendingApplications, rejectApplication } from "../src/db/applications";
import { createIntakeField, ensureDefaultIntakeFields, listIntakeFields, toDef, updateIntakeField } from "../src/db/intake";
import { DEFAULT_INTAKE_FIELDS, answerName, formatAnswer, parseAnswer } from "../src/lib/intake";
import { recordSignup, validateSignup } from "../src/lib/signup-core";
import { addDays, recurringDates, startOfWeek } from "../src/lib/dates";
import { todayISO } from "../src/lib/format";
import { installmentPlan, installmentStates, nextPayable } from "../src/lib/installments";
import { isUniqueViolation } from "../src/lib/pg-errors";
import { slugError, toSlug } from "../src/lib/slug";
import { createTemplate, expiryFor, listTemplates, pickPackage, reorderTemplates, sellPackage } from "../src/db/packages";
import { discountPercent, paymentOptions, pickOption } from "../src/lib/pricing";
import {
  MAX_RECEIPT_BYTES,
  confirmPayment,
  countPendingPayments,
  deletePayment,
  getReceipt,
  listDebtors,
  listPendingPayments,
  listRecentPayments,
  recordClientPayment,
  recordPayment,
  rejectPayment,
} from "../src/db/payments";
import {
  PORTAL_TOKEN_PATTERN,
  createPortalLink,
  getActivePortalLink,
  getActivePortalTokens,
  hashToken,
  revokePortalLinks,
  tokenFor,
} from "../src/db/portal";
import { listClients } from "../src/db/queries";
import * as schema from "../src/db/schema";
import { addUsers, createTestDb } from "./pglite";

const T = "00000000-0000-0000-0000-0000000000a1";
process.env.PORTAL_SECRET ??= "test-secret-test-secret-test-secret";
const trainer = { id: T, timezone: "Europe/Istanbul" };
let withReceiptId = "";

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
      installments: 1,
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
      installments: 1,
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
      installments: 1,
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
      installments: 1,
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
      .values({
        trainerId: T,
        name: "8 Ders Özel",
        sessionType: "private",
        sessionCount: 8,
        validityDays: 35,
        price: "4000",
        compareAtPrice: "5000",
        installmentPrice: "4400",
        installments: 4,
        makeupAllowance: 1,
      })
      .returning(),
  );
  const form = { trainerId: T, packages: [tpl], fields };
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

  // Payment option: cash by default, the package's own installment count, nothing else.
  v = validateSignup(form, fd(base));
  assert.ok("data" in v && v.data.installments === 1, "cash unless picked");
  assert.ok("errors" in validateSignup(form, fd([...base, ["installments", "3"]])), "only the offered plan");

  v = validateSignup(
    form,
    fd([...base, ["installments", "4"], ["healthConsent", "on"], [answerName(kilo.id), "61,5"], [answerName(byLabel("Boy").id), "168"]]),
  );
  assert.ok("data" in v);
  assert.equal(v.data.installments, 4);
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
  assert.deepEqual(
    [ap.name, ap.totalSessions, ap.expiresOn, ap.price, ap.installments],
    ["8 Ders Özel", 8, "2026-11-04", "4400.00", 4],
    "installment total and count from the picked option",
  );
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

  // ---- Installment plans ----
  assert.deepEqual(installmentPlan(4000, 3, "2026-09-29"), [
    { seq: 1, amount: 1334, dueOn: "2026-09-29" },
    { seq: 2, amount: 1333, dueOn: "2026-10-29" },
    { seq: 3, amount: 1333, dueOn: "2026-11-28" },
  ]);
  assert.deepEqual(installmentPlan(4000, 1, "2026-09-29"), [{ seq: 1, amount: 4000, dueOn: "2026-09-29" }]);
  assert.deepEqual(installmentPlan(0, 3, "2026-09-29"), []);
  const st = installmentStates(installmentPlan(4000, 3, "2026-09-29"), 1500, 1000, "2026-11-01");
  assert.deepEqual(
    st.map((x) => [x.status, x.remaining]),
    [["paid", 0], ["overdue", 167], ["upcoming", 1333]],
    "1500 confirmed covers #1 and part of #2; the 1000 pending fills #2 up to 167",
  );
  assert.equal(nextPayable(st)?.seq, 2);

  // ---- Client-reported transfers (amount from the plan, not the client) ----
  const todayTR = todayISO("Europe/Istanbul");
  const [payer] = await asTrainer((tx) =>
    tx.insert(schema.clients).values({ trainerId: T, fullName: "Selin Ak", phone: "905551234567" }).returning({ id: schema.clients.id }),
  );
  // 3 installments starting 35 days ago: #1 and #2 are due, #3 is later.
  const payerPkg = await asTrainer((tx) =>
    sellPackage(tx, T, {
      clientId: payer.id,
      templateId: null,
      name: "12 Ders",
      sessionType: "private",
      totalSessions: 12,
      startsOn: addDays(todayTR, -35),
      expiresOn: null,
      price: 6000,
      makeupAllowance: 0,
      installments: 3,
      payment: null,
    }),
  );
  let payerBal = await balance(payerPkg);
  assert.equal(String(payerBal.overdueAmount), "4000.00", "two of three 2000 installments are due");
  assert.equal(payerBal.installments, 3);

  const who = { trainerId: T, clientId: payer.id };
  const report = (extra: Partial<Parameters<typeof recordClientPayment>[2]> = {}) =>
    db.transaction((tx) =>
      recordClientPayment(tx as unknown as Tx, who, { clientPackageId: payerPkg, paidOn: todayTR, note: null, receipt: null, ...extra }),
    );

  assert.deepEqual(
    await db.transaction((tx) =>
      recordClientPayment(tx as unknown as Tx, { trainerId: T, clientId: zeynep.id }, { clientPackageId: payerPkg, paidOn: todayTR, note: null, receipt: null }),
    ),
    { ok: false, reason: "package" },
    "can't report against someone else's package",
  );
  assert.deepEqual(await report({ receipt: { mimeType: "image/webp", data: Buffer.alloc(MAX_RECEIPT_BYTES + 1) } }), { ok: false, reason: "receipt" });

  const receiptBytes = Buffer.from("fake-receipt-bytes");
  assert.deepEqual(await report({ receipt: { mimeType: "image/webp", data: receiptBytes } }), { ok: true, amount: 2000, seq: 1, of: 3 });
  // The pending report holds installment #1, so the next report is for #2.
  assert.deepEqual(await report(), { ok: true, amount: 2000, seq: 2, of: 3 });

  // Pending reports don't reduce the debt and don't count as income.
  payerBal = await balance(payerPkg);
  assert.equal(String(payerBal.dueAmount), "6000.00");
  const waiting = await asTrainer((tx) => listPendingPayments(tx, T));
  assert.equal(waiting.length, 2);
  assert.equal(await asTrainer((tx) => countPendingPayments(tx, T)), 2);
  const withReceipt = waiting.find((w) => w.receiptType)!;
  withReceiptId = withReceipt.id;
  // PGlite returns Uint8Array, postgres-js a Buffer; compare the bytes.
  assert.ok(Buffer.from((await asTrainer((tx) => getReceipt(tx, T, withReceipt.id)))!.data).equals(receiptBytes));
  assert.ok(!(await asTrainer((tx) => listRecentPayments(tx, T, { clientId: payer.id }))).length, "pending not in history");

  // Confirm #1 → debt and overdue drop; reject #2 → it's payable again.
  const [firstReport, secondReport] = waiting.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  assert.equal((await asTrainer((tx) => confirmPayment(tx, T, firstReport.id))).ok, true);
  assert.equal((await asTrainer((tx) => confirmPayment(tx, T, firstReport.id))).ok, false, "only once");
  payerBal = await balance(payerPkg);
  assert.deepEqual([String(payerBal.dueAmount), String(payerBal.overdueAmount)], ["4000.00", "2000.00"]);
  assert.ok(await asTrainer((tx) => rejectPayment(tx, T, secondReport.id, "Hesaba geçmedi")));
  assert.equal(await asTrainer((tx) => countPendingPayments(tx, T)), 0);
  assert.deepEqual(await report(), { ok: true, amount: 2000, seq: 2, of: 3 }, "rejected installment can be reported again");

  // A trainer-recorded cash payment counts towards the plan too.
  await asTrainer((tx) =>
    recordPayment(tx, T, { clientId: payer.id, clientPackageId: payerPkg, amount: 1500, method: "cash", paidOn: todayTR, note: null }),
  );
  // 2000 + 1500 confirmed, 2000 pending → only 500 of #3 is left to report.
  assert.deepEqual(await report(), { ok: true, amount: 500, seq: 3, of: 3 });
  assert.deepEqual(await report(), { ok: false, reason: "nothing_due" });

  // Confirming a report that no longer fits (the trainer took cash meanwhile) is refused.
  // Pending now: #2 (2000) and #3 (500). The trainer then takes 2000 in cash, leaving 500 due.
  const pendingNow = (await asTrainer((tx) => listPendingPayments(tx, T))).sort((a, b) => Number(a.amount) - Number(b.amount));
  assert.deepEqual(pendingNow.map((p) => String(p.amount)), ["500.00", "2000.00"]);
  await asTrainer((tx) =>
    recordPayment(tx, T, { clientId: payer.id, clientPackageId: payerPkg, amount: 2000, method: "cash", paidOn: todayTR, note: null }),
  );
  assert.deepEqual(await asTrainer((tx) => confirmPayment(tx, T, pendingNow[1].id)), { ok: false, reason: "overpay", due: 500 });
  assert.equal((await asTrainer((tx) => confirmPayment(tx, T, pendingNow[0].id))).ok, true, "the 500 report still fits");
  assert.equal(String((await balance(payerPkg)).dueAmount), "0.00");
  console.log("installments: plan split, overdue in the view, reports sized by the plan, overpay guarded");

  // ---- Availability and client booking ----
  const tue = { weekday: 2, startMinute: 540, endMinute: 780 }; // 09:00–13:00
  let slots = computeSlots({
    rules: [tue, { weekday: 2, startMinute: 1020, endMinute: 1230 }], // + 17:00–20:30
    busy: [{ date: "2026-10-06", startMinute: 600, endMinute: 660 }, { date: "2026-10-06", startMinute: 1050, endMinute: 1110 }],
    daysOff: [{ startsOn: "2026-10-13", endsOn: "2026-10-13" }],
    today: "2026-09-29",
    nowMinute: 1300,
    horizonDays: 21,
    lessonMinutes: 60,
    minNoticeMinutes: 720,
  });
  assert.deepEqual(
    slots.map((d) => `${d.date} ${d.minutes.map(toHHMM).join(",")}`),
    ["2026-10-06 09:00,11:00,12:00,19:00", "2026-10-20 09:00,10:00,11:00,12:00,17:00,18:00,19:00"],
    "busy lessons (incl. partial overlap) removed, 20:00 doesn't fit before 20:30, day off skipped, notice rolls past today",
  );
  slots = computeSlots({ rules: [tue], busy: [], daysOff: [], today: "2026-10-06", nowMinute: 600, horizonDays: 0, lessonMinutes: 60, minNoticeMinutes: 30 });
  assert.deepEqual(slots[0].minutes.map(toHHMM), ["11:00", "12:00"], "min notice from now on the same day");
  assert.equal(
    computeSlots({ rules: [tue], busy: [], daysOff: [], today: "2026-09-29", nowMinute: 0, horizonDays: 21, lessonMinutes: 60, minNoticeMinutes: 0, lastDate: "2026-10-10" }).length,
    2,
    "stops at the package's expiry (6 Oct only; 29 Sep is Tuesday too)",
  );

  // Booking against the real clock: open every day 00:00–24:00, no notice.
  await asTrainer((tx) =>
    tx
      .update(schema.trainers)
      .set({ bookingEnabled: true, bookingLessonMinutes: 60, bookingMinNoticeHours: 0, bookingHorizonDays: 14, lateCancelHours: 24 })
      .where(eq(schema.trainers.id, T)),
  );
  await asTrainer((tx) =>
    replaceAvailabilityRules(tx, T, [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({ weekday, startMinute: 0, endMinute: 1440 }))),
  );
  const [booker] = await asTrainer((tx) =>
    tx.insert(schema.clients).values({ trainerId: T, fullName: "Can Er" }).returning({ id: schema.clients.id }),
  );
  const bookerWho = { trainerId: T, clientId: booker.id };
  const own = (fn: (tx: Tx) => Promise<unknown>) => db.transaction((tx) => fn(tx as unknown as Tx));

  assert.deepEqual(await own((tx) => bookSlot(tx, bookerWho, { date: addDays(todayTR, 3), minute: 600 })), { ok: false, reason: "no_credit" });
  // A duet package isn't bookable; a 2-lesson private one is.
  await asTrainer((tx) =>
    sellPackage(tx, T, { clientId: booker.id, templateId: null, name: "Düet", sessionType: "duet", totalSessions: 4, startsOn: todayTR, expiresOn: null, price: 0, makeupAllowance: 0, installments: 1, payment: null }),
  );
  assert.deepEqual(await own((tx) => bookSlot(tx, bookerWho, { date: addDays(todayTR, 3), minute: 600 })), { ok: false, reason: "no_credit" });
  const bookerPkg = await asTrainer((tx) =>
    sellPackage(tx, T, { clientId: booker.id, templateId: null, name: "2 Ders", sessionType: "private", totalSessions: 2, startsOn: todayTR, expiresOn: null, price: 0, makeupAllowance: 1, installments: 1, payment: null }),
  );

  const view = (await own((tx) => getBookingView(tx, bookerWho))) as Awaited<ReturnType<typeof getBookingView>>;
  assert.equal(view?.packages.length, 1);
  assert.ok(view!.days.length >= 14, "two weeks of open days");

  const b1 = (await own((tx) => bookSlot(tx, bookerWho, { date: addDays(todayTR, 3), minute: 600 }))) as { ok: boolean };
  assert.equal(b1.ok, true);
  assert.deepEqual(await own((tx) => bookSlot(tx, bookerWho, { date: addDays(todayTR, 3), minute: 600 })), { ok: false, reason: "slot_taken" });
  assert.deepEqual(await own((tx) => bookSlot(tx, bookerWho, { date: addDays(todayTR, 3), minute: 630 })), { ok: false, reason: "slot_taken" }, "not a slot boundary");
  assert.equal(((await own((tx) => bookSlot(tx, bookerWho, { date: addDays(todayTR, 4), minute: 600 }))) as { ok: boolean }).ok, true);
  assert.deepEqual(await own((tx) => bookSlot(tx, bookerWho, { date: addDays(todayTR, 5), minute: 600 })), { ok: false, reason: "no_credit" }, "both credits reserved");
  assert.equal((await balance(bookerPkg)).scheduledSessions, 2);

  // Cancel in time → credit back and slot free again.
  let upcomingBookings = (await own((tx) => upcomingForClient(tx, bookerWho))) as Awaited<ReturnType<typeof upcomingForClient>>;
  assert.equal(upcomingBookings.length, 2);
  assert.equal(upcomingBookings[0].lateIfCancelledNow, false);
  const c1 = (await own((tx) => cancelBooking(tx, bookerWho, upcomingBookings[0].attendeeId, { confirmLate: false }))) as { ok: boolean; late: boolean };
  assert.deepEqual([c1.ok, c1.late], [true, false]);
  assert.equal((await balance(bookerPkg)).scheduledSessions, 1);
  assert.equal(((await own((tx) => bookSlot(tx, bookerWho, { date: addDays(todayTR, 3), minute: 600 }))) as { ok: boolean }).ok, true, "freed slot is bookable");

  // Another client can't cancel it.
  assert.deepEqual(await own((tx) => cancelBooking(tx, { trainerId: T, clientId: payer.id }, upcomingBookings[1].attendeeId, { confirmLate: true })), {
    ok: false,
    reason: "not_found",
  });

  // Inside the notice window: needs confirmation, then burns (or uses the makeup).
  await asTrainer((tx) => tx.update(schema.trainers).set({ lateCancelHours: 24 * 10 }).where(eq(schema.trainers.id, T)));
  upcomingBookings = (await own((tx) => upcomingForClient(tx, bookerWho))) as typeof upcomingBookings;
  assert.equal(upcomingBookings[0].lateIfCancelledNow, true);
  assert.deepEqual(await own((tx) => cancelBooking(tx, bookerWho, upcomingBookings[0].attendeeId, { confirmLate: false })), { ok: false, reason: "confirm_late" });
  const c2 = (await own((tx) => cancelBooking(tx, bookerWho, upcomingBookings[0].attendeeId, { confirmLate: true }))) as { ok: boolean; late: boolean; makeupUsed: boolean };
  assert.deepEqual([c2.ok, c2.late, c2.makeupUsed], [true, true, true], "1 makeup allowance forgives it");
  await asTrainer((tx) => tx.update(schema.trainers).set({ lateCancelHours: 24 }).where(eq(schema.trainers.id, T)));
  console.log("booking: slots from weekly hours, double booking and non-private packages refused, cancel in time / late");

  // ---- Group classes ----
  const groupPkg = (clientId: string, total: number) =>
    asTrainer((tx) =>
      sellPackage(tx, T, {
        clientId,
        templateId: null,
        name: `${total} Ders Grup`,
        sessionType: "group",
        totalSessions: total,
        startsOn: todayTR,
        expiresOn: null,
        price: 0,
        makeupAllowance: 0,
        installments: 1,
        payment: null,
      }),
    );
  const [ayse, mehmet, deniz, ozel] = await asTrainer((tx) =>
    tx
      .insert(schema.clients)
      .values(["Ayşe G", "Mehmet G", "Deniz G", "Özel G"].map((fullName) => ({ trainerId: T, fullName })))
      .returning({ id: schema.clients.id }),
  );
  await groupPkg(ayse.id, 4);
  await groupPkg(deniz.id, 8);
  await asTrainer((tx) =>
    sellPackage(tx, T, {
      clientId: ozel.id, templateId: null, name: "Özel", sessionType: "private", totalSessions: 8, startsOn: todayTR,
      expiresOn: null, price: 0, makeupAllowance: 0, installments: 1, payment: null,
    }),
  );
  const classId = await asTrainer((tx) =>
    createGroupClass(tx, trainer, {
      title: "Grup Reformer",
      weekdays: [1, 2, 3, 4, 5, 6, 7],
      startTime: "10:00",
      durationMinutes: 60,
      capacity: 2,
      joinMode: "both",
      startsOn: addDays(todayTR, 1),
    }),
  );
  const occurrences = () =>
    asTrainer((tx) =>
      tx.select().from(schema.lessons).where(eq(schema.lessons.groupClassId, classId)).orderBy(schema.lessons.startsAt),
    );
  let occ = await occurrences();
  assert.equal(occ.length, 27, "tomorrow up to 4 weeks ahead");
  await asTrainer((tx) => ensureGroupOccurrences(tx, trainer));
  assert.equal((await occurrences()).length, 27, "generating again adds nothing");

  assert.deepEqual(await asTrainer((tx) => addGroupMember(tx, trainer, { classId, clientId: ayse.id, startsOn: todayTR })), { ok: true, skipped: 0 });
  assert.deepEqual(await asTrainer((tx) => addGroupMember(tx, trainer, { classId, clientId: mehmet.id, startsOn: todayTR })), { ok: true, skipped: 0 });
  assert.deepEqual(await asTrainer((tx) => addGroupMember(tx, trainer, { classId, clientId: deniz.id, startsOn: todayTR })), { ok: false, reason: "full" });
  const seatsOf = async (clientId: string) =>
    asTrainer((tx) =>
      tx
        .select({ lessonId: schema.lessonAttendees.lessonId, status: schema.lessonAttendees.status, pkg: schema.lessonAttendees.clientPackageId, id: schema.lessonAttendees.id })
        .from(schema.lessonAttendees)
        .innerJoin(schema.lessons, eq(schema.lessons.id, schema.lessonAttendees.lessonId))
        .where(sql`${schema.lessonAttendees.clientId} = ${clientId} and ${schema.lessons.groupClassId} = ${classId}`)
        .orderBy(schema.lessons.startsAt),
    );
  let ayseSeats = await seatsOf(ayse.id);
  assert.equal(ayseSeats.length, 27, "fixed member placed in every occurrence");
  assert.equal(ayseSeats.filter((a) => a.pkg).length, 4, "credits reserved for the first 4, the rest wait for a package");
  assert.ok((await seatsOf(mehmet.id)).every((a) => a.pkg === null), "no group package → booked without one");

  // Drop-ins: full at 2 members; one more place opens a spot.
  const denizWho = { trainerId: T, clientId: deniz.id };
  type GV = NonNullable<Awaited<ReturnType<typeof getGroupView>>>;
  let gv = (await own((tx) => getGroupView(tx, denizWho))) as GV;
  assert.ok(gv.slots.length > 0 && gv.slots.every((sl) => !sl.canJoin), "full classes can't be joined");
  assert.deepEqual(await asTrainer((tx) => updateGroupClass(tx, trainer, classId, { title: "Grup Reformer", capacity: 1, joinMode: "both" })), {
    ok: false,
    reason: "below_members",
    members: 2,
  });
  assert.deepEqual(await asTrainer((tx) => updateGroupClass(tx, trainer, classId, { title: "Grup Reformer", capacity: 3, joinMode: "both" })), { ok: true });
  gv = (await own((tx) => getGroupView(tx, denizWho))) as GV;
  const target = gv.slots[3];
  assert.ok(target.canJoin && target.taken === 2 && target.capacity === 3);
  assert.equal(((await own((tx) => joinGroupLesson(tx, denizWho, target.lessonId))) as { ok: boolean }).ok, true);
  assert.deepEqual(await own((tx) => joinGroupLesson(tx, denizWho, target.lessonId)), { ok: false, reason: "already" });
  assert.deepEqual(await own((tx) => joinGroupLesson(tx, { trainerId: T, clientId: ozel.id }, gv.slots[4].lessonId)), { ok: false, reason: "no_credit" }, "private credits don't pay for group classes");
  const [extra] = await asTrainer((tx) => tx.insert(schema.clients).values({ trainerId: T, fullName: "Dolu G" }).returning({ id: schema.clients.id }));
  await groupPkg(extra.id, 2);
  assert.deepEqual(await own((tx) => joinGroupLesson(tx, { trainerId: T, clientId: extra.id }, target.lessonId)), { ok: false, reason: "full" });
  assert.deepEqual(await asTrainer((tx) => addAttendee(tx, trainer, target.lessonId, extra.id)), { ok: false, reason: "full" }, "trainer is held to the places too");

  // A member skips a week (in time): the class runs on, the place opens, and they aren't put back.
  ayseSeats = await seatsOf(ayse.id);
  const skip = ayseSeats.find((a) => a.lessonId === target.lessonId)!;
  const cancelled = (await own((tx) => cancelBooking(tx, { trainerId: T, clientId: ayse.id }, skip.id, { confirmLate: false }))) as { ok: boolean; late: boolean };
  assert.deepEqual([cancelled.ok, cancelled.late], [true, false]);
  const [still] = await asTrainer((tx) => tx.select().from(schema.lessons).where(eq(schema.lessons.id, target.lessonId)));
  assert.equal(still.status, "scheduled", "group lesson not cancelled with the booking");
  await asTrainer((tx) => ensureGroupOccurrences(tx, trainer));
  assert.equal((await seatsOf(ayse.id)).find((a) => a.lessonId === target.lessonId)!.status, "cancelled", "not re-added");
  assert.equal(((await own((tx) => joinGroupLesson(tx, { trainerId: T, clientId: extra.id }, target.lessonId))) as { ok: boolean }).ok, true, "freed place taken");
  assert.deepEqual(await own((tx) => joinGroupLesson(tx, { trainerId: T, clientId: ayse.id }, target.lessonId)), { ok: false, reason: "full" }, "no way back once it's taken");

  // Buying a group package later pays for the member's upcoming bookings.
  await groupPkg(mehmet.id, 3);
  await asTrainer((tx) => ensureGroupOccurrences(tx, trainer));
  assert.equal((await seatsOf(mehmet.id)).filter((a) => a.pkg).length, 3);

  assert.ok(await asTrainer(async (tx) => {
    const [m] = await tx.select().from(schema.groupClassMembers).where(eq(schema.groupClassMembers.clientId, mehmet.id));
    return removeGroupMember(tx, trainer, m.id);
  }));
  assert.equal((await seatsOf(mehmet.id)).length, 0, "ending a fixed place drops upcoming bookings");

  assert.ok(await asTrainer((tx) => endGroupClass(tx, trainer, classId)));
  occ = await occurrences();
  assert.ok(occ.every((l) => l.status === "cancelled"), "ending the class cancels what's ahead");
  assert.ok((await seatsOf(deniz.id)).every((a) => a.status === "cancelled"), "…and frees the credits");
  console.log("group classes: occurrences ahead, fixed places, capacity, drop-ins, skip a week, late package, end");

  // ---- Package pricing and ordering ----
  assert.equal(discountPercent("5000", "4000"), 20);
  assert.equal(discountPercent("4000", "4000"), null);
  assert.equal(discountPercent(null, "4000"), null);
  const priced = { price: "4000", compareAtPrice: null, installmentPrice: "4500", installments: 3 };
  assert.deepEqual(paymentOptions(priced), [
    { installments: 1, total: 4000 },
    { installments: 3, total: 4500 },
  ]);
  assert.deepEqual(pickOption(priced, 3), { installments: 3, total: 4500 });
  assert.deepEqual(pickOption(priced, 6), { installments: 1, total: 4000 }, "unknown pick falls back to cash");
  assert.deepEqual(paymentOptions({ ...priced, price: null }), [{ installments: 3, total: 4500 }], "installments only");

  const tplInput = {
    name: "Sıralama",
    sessionType: "private" as const,
    sessionCount: 4,
    validityDays: null,
    price: 2000,
    compareAtPrice: null,
    installmentPrice: 2200,
    installments: 1,
    makeupAllowance: 0,
    isPublic: true,
    description: null,
    features: [],
  };
  const x = await asTrainer((tx) => createTemplate(tx, T, tplInput));
  const y = await asTrainer((tx) => createTemplate(tx, T, { ...tplInput, name: "Sıralama 2", installments: 2 }));
  const [xRow] = await asTrainer((tx) => tx.select().from(schema.packageTemplates).where(eq(schema.packageTemplates.id, x)));
  assert.equal(xRow.installmentPrice, null, "installment price dropped without a plan");
  let order = (await asTrainer((tx) => listTemplates(tx, T))).map((t) => t.id);
  assert.deepEqual(order.slice(-2), [x, y], "new packages go last");
  await asTrainer((tx) => reorderTemplates(tx, T, [y, ...order.filter((id) => id !== y)]));
  order = (await asTrainer((tx) => listTemplates(tx, T))).map((t) => t.id);
  assert.equal(order[0], y, "drag-and-drop order saved");
  await assert.rejects(
    asTrainer((tx) => tx.update(schema.packageTemplates).set({ compareAtPrice: "1000" }).where(eq(schema.packageTemplates.id, x))),
    "a 'was' price below the price is refused",
  );
  await assert.rejects(
    asTrainer((tx) => tx.update(schema.packageTemplates).set({ installments: 3 }).where(eq(schema.packageTemplates.id, x))),
    "an installment count needs an installment price",
  );
  console.log("pricing: discount percent, cash and installment options, template order");

  // ---- Archive, restore and erase a client ----
    const [leaver, stayer] = await asTrainer((tx) =>
    tx
      .insert(schema.clients)
      .values([
        { trainerId: T, fullName: "Ayrılan" },
        { trainerId: T, fullName: "Kalan" },
      ])
      .returning({ id: schema.clients.id }),
  );
  const lessonOn = (date: string, clientIds: string[], status: "scheduled" | "attended" = "scheduled") =>
    asTrainer((tx) =>
      createLessons(tx, trainer, { repeat: null, date, time: "08:00", durationMinutes: 50, sessionType: "private", clientIds, status, note: null }),
    );
  const pastSolo = await lessonOn(addDays(todayTR, -3), [leaver.id], "attended");
  const futureSolo = await lessonOn(addDays(todayTR, 3), [leaver.id]);
  const futureShared = await lessonOn(addDays(todayTR, 4), [leaver.id, stayer.id]);
  await asTrainer((tx) => createPortalLink(tx, T, leaver.id));
  assert.equal(await asTrainer((tx) => countUpcomingLessons(tx, leaver.id)), 2);

  assert.equal(await asTrainer((tx) => deleteClient(tx, T, leaver.id)), false, "only archived clients can be erased");
  assert.ok(await asTrainer((tx) => archiveClient(tx, T, leaver.id)));
  assert.equal(await asTrainer((tx) => archiveClient(tx, T, leaver.id)), false, "archiving twice is a no-op");
  const statusOf = async (id: string) =>
    (await asTrainer((tx) => tx.select({ s: schema.lessons.status }).from(schema.lessons).where(eq(schema.lessons.id, id))))[0]?.s;
  const peopleIn = async (id: string) =>
    (await asTrainer((tx) => tx.select().from(schema.lessonAttendees).where(eq(schema.lessonAttendees.lessonId, id)))).map(
      (a) => a.clientId,
    );
  assert.equal(await statusOf(futureSolo), undefined, "their own future lesson is removed");
  assert.equal(await statusOf(futureShared), "scheduled", "a shared lesson stays for the others");
  assert.deepEqual(await peopleIn(futureShared), [stayer.id]);
  assert.deepEqual(await peopleIn(pastSolo), [leaver.id], "history is kept");
  assert.equal(await asTrainer((tx) => getActivePortalLink(tx, leaver.id)), null, "portal link revoked");
  assert.ok(!(await asTrainer((tx) => listClients(tx, T))).some((c) => c.id === leaver.id), "hidden from the client list");
  assert.deepEqual(
    (await asTrainer((tx) => listArchivedClients(tx, T))).map((c) => c.id),
    [leaver.id],
  );

  assert.ok(await asTrainer((tx) => restoreClient(tx, T, leaver.id)));
  assert.ok((await asTrainer((tx) => listClients(tx, T))).some((c) => c.id === leaver.id), "restored");
  await asTrainer((tx) => archiveClient(tx, T, leaver.id));
  assert.ok(await asTrainer((tx) => deleteClient(tx, T, leaver.id)));
  assert.equal(await statusOf(pastSolo), undefined, "lessons only they were in are removed");
  assert.deepEqual(await peopleIn(futureShared), [stayer.id], "shared lessons remain");
  const left = await asTrainer((tx) => tx.select().from(schema.clients).where(eq(schema.clients.id, leaver.id)));
  assert.equal(left.length, 0);
  console.log("clients: archive drops future bookings and the portal link, restore, erase only after archiving");

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
  const otherTrainerReceipt = await db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true)`);
    await tx.execute(sql`set local role authenticated`);
    return getReceipt(tx as unknown as Tx, "00000000-0000-0000-0000-0000000000b2", withReceiptId);
  });
  assert.equal(otherTrainerReceipt, null, "receipts are private to their trainer");
  console.log("cross-tenant attendance and payment delete blocked\n\nall logic checks passed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
