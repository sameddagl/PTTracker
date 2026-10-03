// Applies the migrations to an in-memory Postgres (PGlite) with a minimal
// stand-in for Supabase's auth schema, then checks tenant isolation and the
// package balance view. Run with: pnpm test:db
import assert from "node:assert/strict";
import { createTestDb } from "./pglite";

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
// An instructor who works in A's studio.
const I = "00000000-0000-0000-0000-0000000000c1";

async function main() {
  const db = await createTestDb({ log: true });

  await db.exec(`
    INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
      ('${A}', 'a@test', '{"full_name": "Ayşe Hoca"}'),
      ('${B}', 'b@test', '{}');
  `);

  const trainers = await db.query<{ full_name: string }>("SELECT full_name FROM trainers ORDER BY id");
  assert.deepEqual(
    trainers.rows.map((r) => r.full_name),
    ["Ayşe Hoca", ""],
    "trigger creates trainer rows",
  );

  const asTrainer = async <T>(id: string, fn: () => Promise<T>, account?: string) => {
    await db.exec(
      `BEGIN; SELECT set_config('request.jwt.claim.sub', '${id}', true), set_config('app.account_id', '${account ?? ""}', true); SET LOCAL ROLE authenticated;`,
    );
    try {
      const out = await fn();
      await db.exec("COMMIT");
      return out;
    } catch (e) {
      await db.exec("ROLLBACK");
      throw e;
    }
  };

  // Trainer A: client, 8-lesson package (4000 TL), lessons and a partial payment.
  const ids = await asTrainer(A, async () => {
    const c = await db.query<{ id: string }>(
      `INSERT INTO clients (trainer_id, full_name) VALUES ($1, 'Zeynep') RETURNING id`,
      [A],
    );
    const clientId = c.rows[0].id;
    const p = await db.query<{ id: string }>(
      `INSERT INTO client_packages (trainer_id, client_id, name, session_type, total_sessions, starts_on, expires_on, price, makeup_allowance)
       VALUES ($1, $2, '8 Ders Özel Reformer', 'private', 8, current_date - 10, current_date + 20, 4000, 1) RETURNING id`,
      [A, clientId],
    );
    const packageId = p.rows[0].id;
    const statuses = [
      ["attended", false],
      ["attended", false],
      ["no_show", false],
      ["late_cancel", false],
      ["late_cancel", true], // forgiven as a makeup
      ["cancelled", false],
      ["scheduled", false],
    ] as const;
    for (const [i, [status, makeup]] of statuses.entries()) {
      const l = await db.query<{ id: string }>(
        `INSERT INTO lessons (trainer_id, session_type, starts_at, ends_at)
         VALUES ($1, 'private', now() + ($2 || ' days')::interval, now() + ($2 || ' days')::interval + interval '1 hour') RETURNING id`,
        [A, i - 6],
      );
      await db.query(
        `INSERT INTO lesson_attendees (trainer_id, lesson_id, client_id, client_package_id, status, makeup_used)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [A, l.rows[0].id, clientId, packageId, status, makeup],
      );
    }
    await db.query(
      `INSERT INTO payments (trainer_id, client_id, client_package_id, amount, method) VALUES ($1, $2, $3, 1500, 'bank_transfer')`,
      [A, clientId, packageId],
    );
    return { clientId, packageId };
  });

  const balance = await asTrainer(A, () =>
    db.query<Record<string, unknown>>(`SELECT * FROM client_package_balances WHERE client_package_id = $1`, [
      ids.packageId,
    ]),
  );
  const row = balance.rows[0];
  assert.equal(row.used_sessions, 4, "attended x2 + no_show + unforgiven late_cancel");
  assert.equal(row.remaining_sessions, 4);
  assert.equal(row.scheduled_sessions, 1);
  assert.equal(row.makeups_used, 1);
  assert.equal(String(row.paid_amount), "1500.00");
  assert.equal(String(row.due_amount), "2500.00");
  assert.equal(row.state, "active");
  console.log("balance view ok", row);

  // A freeze covering today marks the package frozen and pushes expiry out.
  await asTrainer(A, () =>
    db.query(
      `INSERT INTO package_freezes (trainer_id, client_package_id, starts_on, ends_on) VALUES ($1, $2, current_date - 2, current_date + 4)`,
      [A, ids.packageId],
    ),
  );
  const frozen = await asTrainer(A, () =>
    db.query<{ state: string; extra: number }>(
      `SELECT b.state, b.effective_expires_on - cp.expires_on AS extra
       FROM client_package_balances b JOIN client_packages cp ON cp.id = b.client_package_id`,
    ),
  );
  assert.deepEqual(frozen.rows[0], { state: "frozen", extra: 7 });
  console.log("freeze ok");

  // Trainer B sees nothing of A's data, including through the view.
  const seenByB = await asTrainer(B, async () => ({
    clients: (await db.query("SELECT 1 FROM clients")).rows.length,
    packages: (await db.query("SELECT 1 FROM client_package_balances")).rows.length,
    payments: (await db.query("SELECT 1 FROM payments")).rows.length,
    trainers: (await db.query("SELECT 1 FROM trainers")).rows.length,
  }));
  assert.deepEqual(seenByB, { clients: 0, packages: 0, payments: 0, trainers: 1 });
  console.log("RLS isolation ok");

  // B cannot write rows claiming to be A.
  await assert.rejects(
    asTrainer(B, () => db.query(`INSERT INTO clients (trainer_id, full_name) VALUES ($1, 'x')`, [A])),
    /row-level security/,
  );

  // B cannot attach its own row to A's client (composite FK, which RLS alone would miss).
  await assert.rejects(
    asTrainer(B, () =>
      db.query(`INSERT INTO payments (trainer_id, client_id, amount) VALUES ($1, $2, 100)`, [B, ids.clientId]),
    ),
    /foreign key/,
  );
  console.log("cross-tenant writes blocked");

  // Studios: every account has its owner as a member (trigger and backfill).
  const owners = await db.query<{ account_id: string; role: string }>("SELECT account_id, role FROM account_members ORDER BY account_id");
  assert.deepEqual(owners.rows, [{ account_id: A, role: "owner" }, { account_id: B, role: "owner" }]);
  await asTrainer(B, () => db.query(`UPDATE trainers SET full_name = 'Barış' WHERE id = $1`, [B]));
  assert.equal((await db.query<{ full_name: string }>(`SELECT full_name FROM account_members WHERE user_id = $1`, [B])).rows[0].full_name, "Barış", "owner name synced");

  // A invites instructor I. I signs up (gets their own empty account) and joins A as instructor.
  await db.exec(`INSERT INTO auth.users (id, email) VALUES ('${I}', 'i@test')`);
  await asTrainer(A, () => db.query(`INSERT INTO account_members (account_id, user_id, role, full_name) VALUES ($1, $2, 'instructor', 'Mert')`, [A, I]));
  const inStudio = await asTrainer(
    I,
    async () => ({
      clients: (await db.query("SELECT 1 FROM clients")).rows.length,
      trainers: (await db.query<{ id: string }>("SELECT id FROM trainers")).rows.map((r) => r.id),
      members: (await db.query("SELECT 1 FROM account_members")).rows.length,
      payments: (await db.query("SELECT 1 FROM payments")).rows.length,
      balances: (await db.query("SELECT 1 FROM client_package_balances")).rows.length,
    }),
    A,
  );
  assert.deepEqual(inStudio, { clients: 1, trainers: [A], members: 2, payments: 0, balances: 1 }, "instructor sees the studio but no payments");
  // Without the studio selected, I is in their own (empty) account.
  assert.equal((await asTrainer(I, async () => (await db.query("SELECT 1 FROM clients")).rows.length)), 0);
  // A forged account id the user isn't a member of reaches nothing.
  assert.equal((await asTrainer(B, async () => (await db.query("SELECT 1 FROM clients")).rows.length, A)), 0, "non-member can't select a studio");
  // Instructors can't change settings, the team or money; they can edit their own profile row.
  await asTrainer(I, () => db.query(`UPDATE trainers SET business_name = 'x' WHERE id = $1`, [A]), A);
  assert.equal((await db.query<{ business_name: string | null }>(`SELECT business_name FROM trainers WHERE id = $1`, [A])).rows[0].business_name, null);
  await assert.rejects(
    asTrainer(I, () => db.query(`INSERT INTO account_members (account_id, user_id, role) VALUES ($1, $2, 'owner')`, [A, B]), A),
    /row-level security/,
  );
  await assert.rejects(
    asTrainer(I, () => db.query(`INSERT INTO payments (trainer_id, client_id, amount) VALUES ($1, $2, 100)`, [A, ids.clientId]), A),
    /row-level security/,
  );
  await asTrainer(I, () => db.query(`UPDATE account_members SET bio = 'Reformer' WHERE user_id = $1`, [I]), A);
  await asTrainer(I, () => db.query(`UPDATE account_members SET role = 'instructor' WHERE user_id = $1`, [A]), A);
  await assert.rejects(asTrainer(I, () => db.query(`UPDATE account_members SET role = 'owner' WHERE user_id = $1`, [I]), A), /only the owner/);
  const team = await db.query<{ user_id: string; role: string; bio: string | null }>(`SELECT user_id, role, bio FROM account_members WHERE account_id = $1 ORDER BY role`, [A]);
  assert.deepEqual(team.rows, [{ user_id: A, role: "owner", bio: null }, { user_id: I, role: "instructor", bio: "Reformer" }]);
  // The owner sees the money in the studio context too.
  assert.equal((await asTrainer(A, async () => (await db.query("SELECT 1 FROM payments")).rows.length, A)), 1);
  // A deactivated instructor loses access.
  await db.query(`UPDATE account_members SET active = false WHERE user_id = $1 AND account_id = $2`, [I, A]);
  assert.equal((await asTrainer(I, async () => (await db.query("SELECT 1 FROM clients")).rows.length, A)), 0, "deactivated member sees nothing");
  console.log("studio members: instructor sees the studio, not money or settings");

  // A package with lessons or payments can't be hard-deleted (it gets cancelled instead)...
  await assert.rejects(
    asTrainer(A, () => db.query(`DELETE FROM client_packages WHERE id = $1`, [ids.packageId])),
    /foreign key/,
  );
  // ...but deleting the client removes everything that belongs to them.
  await asTrainer(A, () => db.query(`DELETE FROM clients WHERE id = $1`, [ids.clientId]));
  const leftovers = await db.query<{ n: number }>(
    `SELECT (SELECT count(*) FROM client_packages) + (SELECT count(*) FROM lesson_attendees)
          + (SELECT count(*) FROM payments) + (SELECT count(*) FROM package_freezes) AS n`,
  );
  assert.equal(Number(leftovers.rows[0].n), 0, "client delete cascades");
  console.log("package delete blocked, client delete cascades");

  // anon has no table access at all.
  await db.exec("SET ROLE anon");
  await assert.rejects(db.query("SELECT 1 FROM clients"), /permission denied/);
  await db.exec("RESET ROLE");
  console.log("anon blocked\n\nall database checks passed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
