// Runs the real package/lesson/attendance functions against PGlite, as a
// signed-in trainer with RLS on. Run with: pnpm test:logic
import assert from "node:assert/strict";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import type { Tx } from "../src/db";
import { createLesson, setAttendance } from "../src/db/lessons";
import { expiryFor, pickPackage, sellPackage } from "../src/db/packages";
import * as schema from "../src/db/schema";
import { addUsers, createTestDb } from "./pglite";

const T = "00000000-0000-0000-0000-0000000000a1";
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
    createLesson(tx, trainer, {
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
    createLesson(tx, trainer, {
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
    createLesson(tx, trainer, {
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
    createLesson(tx, trainer, {
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

  // Another trainer's attendee id is invisible (RLS) → null, nothing changed.
  await addUsers(pg, [{ id: "00000000-0000-0000-0000-0000000000b2" }]);
  const other = await db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true)`);
    await tx.execute(sql`set local role authenticated`);
    return setAttendance(tx as unknown as Tx, "00000000-0000-0000-0000-0000000000b2", aAtt.id, "attended");
  });
  assert.equal(other, null);
  console.log("cross-tenant attendance blocked\n\nall logic checks passed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
