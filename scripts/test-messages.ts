// Trainer ↔ client messages against PGlite: the trainer side with RLS on, the
// portal side as the owner (like adminDb), scoped by the token's ids.
// Run with: npx tsx --conditions=react-server scripts/test-messages.ts
import assert from "node:assert/strict";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import type { Tx } from "../src/db";
import {
  CLIENT_RATE_LIMIT,
  MESSAGE_MAX_LENGTH,
  cleanBody,
  countUnread,
  getClientThread,
  getThread,
  listMessageableClients,
  listThreads,
  markReadByClient,
  markThreadRead,
  sendClientMessage,
  sendTrainerMessage,
} from "../src/db/messages";
import * as schema from "../src/db/schema";
import { addUsers, createTestDb } from "./pglite";

const A = "00000000-0000-0000-0000-0000000000a1";
const B = "00000000-0000-0000-0000-0000000000b2";

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
  const asOwner = <R>(fn: (tx: Tx) => Promise<R>) => db.transaction((tx) => fn(tx as unknown as Tx));

  const [zeynep, ali, arsiv] = await as(A, (tx) =>
    tx
      .insert(schema.clients)
      .values([
        { trainerId: A, fullName: "Zeynep" },
        { trainerId: A, fullName: "Ali" },
        { trainerId: A, fullName: "Arşiv", archivedAt: new Date() },
      ])
      .returning({ id: schema.clients.id }),
  );
  const [other] = await as(B, (tx) => tx.insert(schema.clients).values({ trainerId: B, fullName: "Diğer" }).returning({ id: schema.clients.id }));
  const zWho = { trainerId: A, clientId: zeynep.id };

  // Body validation.
  assert.deepEqual(cleanBody("  merhaba \r\n "), { ok: true, body: "merhaba" });
  assert.deepEqual(cleanBody("   "), { ok: false, reason: "empty" });
  assert.deepEqual(cleanBody(42), { ok: false, reason: "empty" });
  assert.equal(cleanBody("ş".repeat(MESSAGE_MAX_LENGTH)).ok, true);
  assert.deepEqual(cleanBody("x".repeat(MESSAGE_MAX_LENGTH + 1)), { ok: false, reason: "too_long" });
  assert.deepEqual(await as(A, (tx) => sendTrainerMessage(tx, A, zeynep.id, "")), { ok: false, reason: "empty" });
  assert.deepEqual(await asOwner((tx) => sendClientMessage(tx, zWho, "y".repeat(2001))), { ok: false, reason: "too_long" });
  // The database check backs the app-side one.
  await assert.rejects(
    as(A, (tx) => tx.insert(schema.messages).values({ trainerId: A, clientId: zeynep.id, sender: "trainer", body: "" })),
  );

  // Trainer writes, the client reads it on the portal.
  const sent = await as(A, (tx) => sendTrainerMessage(tx, A, zeynep.id, " Yarın 10:00 uygun mu? "));
  assert.ok(sent.ok);
  assert.equal(sent.message.body, "Yarın 10:00 uygun mu?");
  assert.equal(sent.firstUnread, true);
  const second = await as(A, (tx) => sendTrainerMessage(tx, A, zeynep.id, "Haber ver."));
  assert.ok(second.ok);
  assert.equal(second.firstUnread, false, "a second unread message in a row is not worth another email");

  let thread = await asOwner((tx) => getClientThread(tx, zWho));
  assert.deepEqual(
    thread.map((m) => [m.sender, m.body, m.readAt]),
    [
      ["trainer", "Yarın 10:00 uygun mu?", null],
      ["trainer", "Haber ver.", null],
    ],
  );
  assert.equal(await asOwner((tx) => markReadByClient(tx, zWho)), 2);
  assert.equal(await asOwner((tx) => markReadByClient(tx, zWho)), 0);
  thread = await asOwner((tx) => getClientThread(tx, zWho));
  assert.ok(thread.every((m) => m.readAt));

  // The client answers; unread counts for the trainer.
  const reply = await asOwner((tx) => sendClientMessage(tx, zWho, "Olur, görüşürüz!"));
  assert.ok(reply.ok);
  assert.equal(reply.firstUnread, true);
  assert.ok((await asOwner((tx) => sendClientMessage(tx, { trainerId: A, clientId: ali.id }, "Selam hocam"))).ok);
  assert.equal(await as(A, (tx) => countUnread(tx, A)), 2);

  const threads = await as(A, (tx) => listThreads(tx, A));
  assert.deepEqual(
    threads.map((t) => [t.fullName, t.body, t.sender, t.unread]),
    [
      ["Ali", "Selam hocam", "client", 1],
      ["Zeynep", "Olur, görüşürüz!", "client", 1],
    ],
  );
  assert.equal((await as(A, (tx) => getThread(tx, A, zeynep.id))).length, 3);
  assert.deepEqual(
    (await as(A, (tx) => getThread(tx, A, zeynep.id, { limit: 2 }))).map((m) => m.body),
    ["Haber ver.", "Olur, görüşürüz!"],
    "limit keeps the newest, oldest first",
  );

  assert.equal(await as(A, (tx) => markThreadRead(tx, A, zeynep.id)), 1);
  assert.equal(await as(A, (tx) => countUnread(tx, A)), 1);
  // The trainer reading the client's messages leaves the client's read state alone.
  assert.equal(await asOwner((tx) => markReadByClient(tx, zWho)), 0);

  // Archived clients get no new messages; the picker lists active clients only.
  assert.deepEqual(await as(A, (tx) => sendTrainerMessage(tx, A, arsiv.id, "Selam")), { ok: false, reason: "not_found" });
  assert.deepEqual(
    (await as(A, (tx) => listMessageableClients(tx, A))).map((c) => c.fullName),
    ["Ali", "Zeynep"],
  );

  // Cross-tenant isolation: trainer B sees nothing of A's and cannot write to A's clients.
  assert.equal((await as(B, (tx) => listThreads(tx, B))).length, 0);
  assert.equal((await as(B, (tx) => listThreads(tx, A))).length, 0, "RLS hides rows even when asked for A's id");
  assert.equal((await as(B, (tx) => getThread(tx, A, zeynep.id))).length, 0);
  assert.equal(await as(B, (tx) => countUnread(tx, A)), 0);
  assert.equal(await as(B, (tx) => markThreadRead(tx, A, zeynep.id)), 0);
  assert.deepEqual(await as(B, (tx) => sendTrainerMessage(tx, B, zeynep.id, "Merhaba")), { ok: false, reason: "not_found" });
  assert.deepEqual(await as(B, (tx) => sendTrainerMessage(tx, A, zeynep.id, "Merhaba")), { ok: false, reason: "not_found" });
  await assert.rejects(
    as(B, (tx) => tx.insert(schema.messages).values({ trainerId: B, clientId: zeynep.id, sender: "trainer", body: "x" })),
    "the (client, trainer) foreign key refuses another trainer's client",
  );
  await assert.rejects(
    as(B, (tx) => tx.insert(schema.messages).values({ trainerId: A, clientId: zeynep.id, sender: "trainer", body: "x" })),
    "RLS refuses writing as another trainer",
  );
  // A portal token for B's client cannot reach A's thread: ids must match together.
  assert.deepEqual(await asOwner((tx) => sendClientMessage(tx, { trainerId: B, clientId: zeynep.id }, "x")), { ok: false, reason: "not_found" });
  assert.equal((await asOwner((tx) => getClientThread(tx, { trainerId: B, clientId: zeynep.id }))).length, 0);
  assert.equal((await asOwner((tx) => getClientThread(tx, { trainerId: B, clientId: other.id }))).length, 0);

  // Client rate limit.
  const oWho = { trainerId: B, clientId: other.id };
  for (let i = 0; i < CLIENT_RATE_LIMIT.count; i++) assert.ok((await asOwner((tx) => sendClientMessage(tx, oWho, `mesaj ${i}`))).ok);
  assert.deepEqual(await asOwner((tx) => sendClientMessage(tx, oWho, "bir tane daha")), { ok: false, reason: "rate_limited" });
  // Older messages fall out of the window.
  await pg.query(`UPDATE messages SET created_at = now() - interval '11 minutes' WHERE client_id = $1`, [other.id]);
  assert.ok((await asOwner((tx) => sendClientMessage(tx, oWho, "şimdi olur"))).ok);
  // The trainer's own messages are not limited.
  for (let i = 0; i < CLIENT_RATE_LIMIT.count + 1; i++) assert.ok((await as(B, (tx) => sendTrainerMessage(tx, B, other.id, `hoca ${i}`))).ok);
  assert.equal(await as(B, (tx) => countUnread(tx, B)), CLIENT_RATE_LIMIT.count + 1);

  // Deleting a client removes the thread.
  await as(A, (tx) => tx.delete(schema.clients).where(sql`${schema.clients.id} = ${ali.id}`));
  assert.deepEqual(
    (await as(A, (tx) => listThreads(tx, A))).map((t) => t.fullName),
    ["Zeynep"],
  );

  console.log("messages: all checks passed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
