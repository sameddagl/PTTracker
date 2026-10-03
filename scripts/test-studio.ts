// Studios against PGlite: an owner and an invited instructor working in one
// account. Lessons carry their instructor, conflicts are per instructor, an
// instructor manages only their own lessons, and pay is computed and frozen.
// Run with: npx tsx --conditions=react-server scripts/test-studio.ts
import assert from "node:assert/strict";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import type { Member } from "../src/db/membership";
import { pickMembership } from "../src/db/membership";
import type { Tx } from "../src/db/client";
import { bookSlot, getBookingView, replaceAvailabilityRules } from "../src/db/booking";
import { createLessons, findConflicts, setAttendance, setLessonInstructor } from "../src/db/lessons";
import { pickPackage, sellPackage } from "../src/db/packages";
import { addDays } from "../src/lib/dates";
import { closePayrollMonth, payrollFor, setPayrollPaid } from "../src/db/payroll";
import * as schema from "../src/db/schema";
import { addMemberWithoutLogin, clientIdsTaughtBy, mayManageLesson, mayOpenClient, resolveInstructor, setMemberPermission, updateMember } from "../src/db/team";
import { can } from "../src/lib/permissions";
import { computePayroll, monthRange } from "../src/lib/payroll";
import { addUsers, createTestDb } from "./pglite";

const A = "00000000-0000-0000-0000-0000000000a1"; // studio owner
const I = "00000000-0000-0000-0000-0000000000c1"; // instructor
const TZ = "Europe/Istanbul";

async function main() {
  // ---- Pure parts ----
  const lesson = (sessionType: "private" | "duet" | "group", statuses: string[], price = 6000, total = 12) => ({
    id: `${sessionType}-${statuses.join()}`,
    startsAt: new Date("2026-10-05T07:00:00Z"),
    sessionType,
    attendees: statuses.map((s) => ({ status: s as "attended", packagePrice: price, packageLessons: total })),
  });
  const perLesson = { type: "per_lesson" as const, private: 600, duet: 750, trio: 800, group: 900 };
  const lessonsIn = [lesson("private", ["attended"]), lesson("duet", ["attended", "late_cancel"]), lesson("group", ["no_show"]), lesson("private", ["cancelled"])];
  assert.deepEqual(
    { amount: computePayroll(lessonsIn, perLesson, false).amount, lessons: computePayroll(lessonsIn, perLesson, false).lessons },
    { amount: 1350, lessons: 2 },
    "per lesson: only lessons someone came to",
  );
  assert.equal(computePayroll(lessonsIn, perLesson, true).amount, 2250, "late cancels and no-shows count when the studio says so");
  // 6000 / 12 = 500 per client-lesson; duet with one counted client = 500; 40 % of (500 + 500) = 400.
  assert.equal(computePayroll(lessonsIn, { type: "percent", percent: 40 }, false).amount, 400, "percentage of what the lessons were worth");
  assert.equal(computePayroll(lessonsIn, null, false).amount, 0, "no rule, no pay");
  assert.deepEqual(monthRange("2026-12"), { from: "2026-12-01", to: "2027-01-01" });

  const m = (accountId: string, onboarded: boolean): Member & { onboarded: boolean } => ({ id: accountId, userId: I, accountId, role: "instructor", name: "", onboarded });
  assert.equal(pickMembership([m(I, false), m(A, true)], I, undefined)?.accountId, A, "a new instructor works in the studio, not their empty account");
  assert.equal(pickMembership([m(I, true), m(A, true)], I, undefined)?.accountId, I, "with their own account set up, that comes first");
  assert.equal(pickMembership([m(I, true), m(A, true)], I, A)?.accountId, A, "the chosen account wins");
  assert.equal(pickMembership([m(I, true)], I, A)?.accountId, I, "a chosen account they left is ignored");
  console.log("payroll and account choice ok");

  // ---- Database ----
  const pg = await createTestDb();
  await addUsers(pg, [
    { id: A, name: "Ayşe Hoca" },
    { id: I, name: "Mert" },
  ]);
  const db = drizzle(pg, { schema });
  const as = <R>(userId: string, account: string, fn: (tx: Tx) => Promise<R>) =>
    db.transaction(async (tx) => {
      await tx.execute(sql`select set_config('request.jwt.claim.sub', ${userId}, true), set_config('app.account_id', ${account}, true)`);
      await tx.execute(sql`set local role authenticated`);
      return fn(tx as unknown as Tx);
    });
  const asOwner = <R>(fn: (tx: Tx) => Promise<R>) => db.transaction((tx) => fn(tx as unknown as Tx));

  await asOwner((tx) => tx.update(schema.trainers).set({ onboardedAt: new Date(), timezone: TZ }).where(sql`id = ${A}`));
  const [ownerRow] = await asOwner((tx) => tx.select().from(schema.accountMembers).where(sql`account_id = ${A}`));
  const [instRow] = await asOwner((tx) =>
    tx.insert(schema.accountMembers).values({ accountId: A, userId: I, role: "instructor", fullName: "Mert", color: "sky" }).returning(),
  );
  const owner: Member = { id: ownerRow.id, userId: A, accountId: A, role: "owner", name: "Ayşe Hoca" };
  const inst: Member = { id: instRow.id, userId: I, accountId: A, role: "instructor", name: "Mert" };
  const trainer = { id: A, timezone: TZ };

  const [zeynep, ali] = await as(A, A, (tx) =>
    tx
      .insert(schema.clients)
      .values([
        { trainerId: A, fullName: "Zeynep" },
        { trainerId: A, fullName: "Ali" },
      ])
      .returning({ id: schema.clients.id }),
  );
  const [pkg] = await as(A, A, (tx) =>
    tx
      .insert(schema.clientPackages)
      .values({ trainerId: A, clientId: zeynep.id, name: "12 ders", sessionType: "private", totalSessions: 12, price: "6000", startsOn: "2026-10-01" })
      .returning({ id: schema.clientPackages.id }),
  );
  assert.ok(pkg);

  // Who teaches: the owner picks anyone active; an instructor always plans their own.
  assert.equal(await as(A, A, (tx) => resolveInstructor(tx, owner, inst.id)), inst.id);
  assert.equal(await as(I, A, (tx) => resolveInstructor(tx, inst, owner.id)), inst.id, "instructors can't plan for others");

  // Same slot for both: no conflict across instructors, a conflict for the same one.
  const slot = { date: "2026-10-05", time: "10:00", durationMinutes: 60, sessionType: "private" as const, status: "scheduled" as const, note: null, repeat: null };
  const mine = await as(I, A, (tx) => createLessons(tx, trainer, { ...slot, clientIds: [zeynep.id], instructorId: inst.id }));
  assert.equal((await as(A, A, (tx) => findConflicts(tx, trainer, { dates: ["2026-10-05"], time: "10:00", durationMinutes: 60, instructorId: owner.id }))).length, 0);
  assert.equal((await as(A, A, (tx) => findConflicts(tx, trainer, { dates: ["2026-10-05"], time: "10:30", durationMinutes: 60, instructorId: inst.id }))).length, 1);
  const ownersLesson = await as(A, A, (tx) => createLessons(tx, trainer, { ...slot, clientIds: [ali.id] }));
  const [ownerLessonRow] = await asOwner((tx) => tx.select({ instructorId: schema.lessons.instructorId }).from(schema.lessons).where(sql`id = ${ownersLesson}`));
  assert.equal(ownerLessonRow.instructorId, owner.id, "left out, the owner teaches (trigger)");

  assert.equal(await as(I, A, (tx) => mayManageLesson(tx, inst, mine)), true);
  assert.equal(await as(I, A, (tx) => mayManageLesson(tx, inst, ownersLesson)), false, "an instructor can't change a colleague's lesson");
  assert.equal(await as(A, A, (tx) => mayManageLesson(tx, owner, mine)), true);
  assert.deepEqual([...(await as(I, A, (tx) => clientIdsTaughtBy(tx, A, inst.id)))], [zeynep.id]);

  // Pay: Mert teaches Zeynep (12 lessons for 6000) once; she comes.
  const [att] = await asOwner((tx) => tx.select({ id: schema.lessonAttendees.id }).from(schema.lessonAttendees).where(sql`lesson_id = ${mine}`));
  await as(I, A, (tx) => setAttendance(tx, A, att.id, "attended"));
  await as(A, A, (tx) => updateMember(tx, A, inst.id, { payRule: { type: "percent", percent: 40 } }));
  const [row] = await as(A, A, (tx) => payrollFor(tx, A, "2026-10", { tz: TZ, countsMissed: false }));
  assert.deepEqual([row.member.id, row.summary.lessons, row.summary.amount], [inst.id, 1, 200], "40 % of a 500 TL lesson");
  // Closing freezes it: a later rule change doesn't move a closed month.
  assert.ok(await as(A, A, (tx) => closePayrollMonth(tx, A, inst.id, "2026-10", row.summary)));
  await as(A, A, (tx) => updateMember(tx, A, inst.id, { payRule: { type: "percent", percent: 90 } }));
  const [frozen] = await as(A, A, (tx) => payrollFor(tx, A, "2026-10", { tz: TZ, countsMissed: false }));
  assert.equal(frozen.summary.amount, 200);
  assert.ok(frozen.closed);
  // The instructor sees their own closed month but can't mark it paid.
  const seen = await as(I, A, (tx) => tx.select().from(schema.payrollMonths));
  assert.equal(seen.length, 1);
  assert.equal(await as(I, A, (tx) => setPayrollPaid(tx, A, frozen.closed!.id, true)), false, "only the owner marks pay as paid");

  // Handing the lesson to the owner reports the client to tell.
  const handed = await as(A, A, (tx) => setLessonInstructor(tx, A, mine, owner.id));
  assert.equal(handed?.lessons.length, 1);

  // ---- Booking in a studio ----
  // Both teach every day 00:00–24:00 (real clock); slots at 21:00 stay clear of the lessons above.
  await as(A, A, (tx) =>
    tx.update(schema.trainers).set({ bookingEnabled: true, bookingLessonMinutes: 60, bookingMinNoticeHours: 0, bookingHorizonDays: 14 }).where(sql`id = ${A}`),
  );
  const allWeek = [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({ weekday, startMinute: 0, endMinute: 1440 }));
  await as(A, A, (tx) => replaceAvailabilityRules(tx, A, allWeek, owner.id));
  await as(A, A, (tx) => replaceAvailabilityRules(tx, A, allWeek, inst.id));
  const who = { trainerId: A, clientId: ali.id };
  // Ali's package is for Mert only.
  const [tpl] = await as(A, A, (tx) =>
    tx
      .insert(schema.packageTemplates)
      .values({ trainerId: A, name: "Mert özel", sessionType: "private", sessionCount: 4, price: "4000", instructorIds: [inst.id] })
      .returning({ id: schema.packageTemplates.id }),
  );
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
  const day = addDays(today, 3);
  const aliPkg = await as(A, A, (tx) =>
    sellPackage(tx, A, { clientId: ali.id, templateId: tpl.id, name: "Mert özel", sessionType: "private", totalSessions: 4, startsOn: today, expiresOn: null, price: 4000, makeupAllowance: 0, installments: 1, payment: null }),
  );
  const [aliRow] = await asOwner((tx) => tx.select({ ids: schema.clientPackages.instructorIds }).from(schema.clientPackages).where(sql`id = ${aliPkg}`));
  assert.deepEqual(aliRow.ids, [inst.id], "the template's instructor limit comes along with the sale");
  const view = await asOwner((tx) => getBookingView(tx, who));
  assert.deepEqual(view?.instructors.map((i) => i.id) ?? [], [], "only Mert is bookable with this package, so there is no choice to make");
  assert.ok(view!.days.length > 0);
  // Asking for the owner fails (package doesn't allow); "fark etmez" goes to Mert.
  assert.deepEqual(await asOwner((tx) => bookSlot(tx, who, { date: day, minute: 1260, instructorId: owner.id })), { ok: false, reason: "no_credit" });
  const booked = await asOwner((tx) => bookSlot(tx, who, { date: day, minute: 1260, instructorId: null }));
  assert.equal(booked.ok && booked.instructorId, inst.id);
  // A second client with an open package can pick either; at Mert's taken hour the owner is still free.
  const zWho = { trainerId: A, clientId: zeynep.id };
  const both = await asOwner((tx) => getBookingView(tx, zWho));
  assert.deepEqual(both?.instructors.map((i) => i.id).sort(), [owner.id, inst.id].sort(), "two bookable instructors to pick from");
  const z1 = await asOwner((tx) => bookSlot(tx, zWho, { date: day, minute: 1260, instructorId: null }));
  assert.equal(z1.ok && z1.instructorId, owner.id, "whoever is free takes it");
  // Lessons with Mert draw only on packages that allow him; the owner's lessons skip Ali's package.
  assert.equal(await as(A, A, (tx) => pickPackage(tx, ali.id, "private", { instructorId: owner.id })), null);
  assert.equal(await as(A, A, (tx) => pickPackage(tx, ali.id, "private", { instructorId: inst.id })), aliPkg);
  console.log("studio booking and instructor-limited packages ok");

  // An instructor without a login: the owner adds them and plans their lessons.
  const noLogin = await as(A, A, (tx) => addMemberWithoutLogin(tx, A, { fullName: "Deniz", color: null }));
  const [noLoginRow] = await asOwner((tx) => tx.select().from(schema.accountMembers).where(sql`id = ${noLogin}`));
  assert.equal(noLoginRow.userId, null);
  assert.ok(noLoginRow.color && noLoginRow.color !== "sky", "gets a free colour");
  assert.equal(await as(A, A, (tx) => resolveInstructor(tx, owner, noLogin)), noLogin, "the owner can plan their lessons");
  await assert.rejects(
    as(I, A, (tx) => addMemberWithoutLogin(tx, A, { fullName: "X", color: null })),
    (e: { cause?: unknown }) => /row-level security/.test(String(e.cause ?? e)),
    "only the owner adds instructors",
  );
  console.log("instructors without a login ok");

  // ---- Per-instructor permissions ----
  assert.equal(can(owner, "editClients"), true, "the owner can do everything");
  assert.deepEqual(
    [can(inst, "seeAllClients"), can(inst, "editClients"), can(inst, "manageLessons"), can(inst, "editAvailability"), can(inst, "editPrograms"), can(inst, "seeOthersLessons")],
    [true, false, true, false, true, true],
    "defaults",
  );
  const [extra] = await as(A, A, (tx) => tx.insert(schema.clients).values({ trainerId: A, fullName: "Ece" }).returning({ id: schema.clients.id }));
  assert.equal(await as(I, A, (tx) => mayOpenClient(tx, inst, extra.id)), true, "sees every client by default");
  await as(A, A, (tx) => setMemberPermission(tx, A, inst.id, "seeAllClients", false));
  await as(A, A, (tx) => setMemberPermission(tx, A, inst.id, "manageLessons", false));
  const [permRow] = await asOwner((tx) => tx.select({ p: schema.accountMembers.permissions }).from(schema.accountMembers).where(sql`id = ${inst.id}`));
  const limited: Member = { ...inst, permissions: permRow.p };
  assert.equal(await as(I, A, (tx) => mayOpenClient(tx, limited, extra.id)), false, "only taught clients once turned off");
  // Ali booked a lesson with Mert above (Zeynep's lesson was handed to the owner).
  assert.equal(await as(I, A, (tx) => mayOpenClient(tx, limited, ali.id)), true);
  const alisLesson = booked.ok ? booked.lessonId : "";
  assert.equal(await as(I, A, (tx) => mayManageLesson(tx, inst, alisLesson)), true, "own lesson with permission");
  assert.equal(await as(I, A, (tx) => mayManageLesson(tx, limited, alisLesson)), false, "can't change lessons without permission to plan");
  assert.equal(await as(A, A, (tx) => setMemberPermission(tx, A, owner.id, "editClients", false)), false, "the owner has no switches");
  // An instructor can't grant themselves anything.
  await assert.rejects(
    as(I, A, (tx) => tx.update(schema.accountMembers).set({ permissions: { editClients: true } }).where(sql`id = ${inst.id}`)),
    (e: { cause?: unknown }) => /only the owner/.test(String(e.cause ?? e)),
  );
  console.log("per-instructor permissions ok");
  console.log("studio lessons, permissions and pay ok\n\nall studio checks passed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
