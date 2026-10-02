// Demo data for the promotional video, on the "reformpilates" trainer of the
// DEV database only. Fictional people, fake phone numbers, no e-mails.
//
//   npx tsx --conditions=react-server --env-file=.env.local scripts/seed-demo.ts [--reset]
//
// Refuses to run unless the trainer exists and has no clients yet, so it can
// never touch real data. `--reset` first deletes that trainer's clients
// (everything hanging off them cascades), the lessons left empty by that and
// the templates this script added, then seeds again. Other trainers are never
// read or written.
import { and, eq, inArray, isNull, notExists, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { Tx } from "../src/db";
import { confirmAttendance } from "../src/db/engagement";
import { addGroupMember, ensureGroupOccurrences } from "../src/db/groups";
import { listIntakeFields } from "../src/db/intake";
import { createLessons, setAttendance, type AttendanceStatus } from "../src/db/lessons";
import { sendClientMessage, sendTrainerMessage, markReadByClient, markThreadRead, type SendResult } from "../src/db/messages";
import {
  createTemplate,
  expiryFor,
  listTemplates,
  pickPackage,
  reorderTemplates,
  sellPackage,
  updateTemplate,
  type PaymentMethod,
  type SessionType,
  type TemplateInput,
} from "../src/db/packages";
import { recordClientPayment, recordPayment } from "../src/db/payments";
import { createPortalLink } from "../src/db/portal";
import { copyProgram, createProgram, ensureExerciseLibrary, getProgram, sendProgram, setCheckin } from "../src/db/programs";
import { addNote, grantHealthConsent, saveMeasurements } from "../src/db/progress";
import * as schema from "../src/db/schema";
import { clients, groupClasses, lessonAttendees, lessonSeries, lessons, messages, packageTemplates, programs, trainers } from "../src/db/schema";
import { addDays, recurringDates, startOfWeek } from "../src/lib/dates";
import { todayISO } from "../src/lib/format";
import { installmentPlan } from "../src/lib/installments";
import { programInputSchema, type ProgramInput } from "../src/lib/programs";
import { recordSignup, validateSignup } from "../src/lib/signup-core";
import { normalizePhone } from "../src/lib/whatsapp";

// Own connection, like src/db/index.ts's adminDb (owner role, RLS bypassed);
// that module pulls in Next.js request APIs that don't load in a script.
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set (run with --env-file=.env.local)");
const pg = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
const adminDb = drizzle(pg, { schema });

const SLUG = "reformpilates";
const RESET = process.argv.includes("--reset");
const phone = (n: number) => normalizePhone(`0555 010 20 ${String(n).padStart(2, "0")}`)!;

// ---- Package templates, in display order ----

type TemplateKey = "trial" | "private8" | "private12" | "duet4" | "group8";
type TemplateSpec = Omit<TemplateInput, "description" | "features"> & {
  key: TemplateKey;
  /** Names the template may already have (the two the trainer created). */
  legacyNames?: string[];
  description?: string | null;
  features?: string[];
};

const TEMPLATES: TemplateSpec[] = [
  {
    key: "trial",
    name: "Deneme Dersi",
    sessionType: "private",
    sessionCount: 1,
    validityDays: 14,
    price: 750,
    compareAtPrice: null,
    installmentPrice: null,
    installments: 1,
    makeupAllowance: 0,
    isPublic: true,
    isTrial: true,
    description: "Reformer ile ilk tanışma. Duruşuna ve hareket alışkanlıklarına birlikte bakıyor, sana uygun paketi seçiyoruz.",
    features: ["Birebir reformer dersi", "Duruş değerlendirmesi", "Sana uygun programın planı"],
  },
  {
    key: "private8",
    name: "8 Ders Özel Reformer",
    legacyNames: ["8 Ders Özel"],
    sessionType: "private",
    sessionCount: 8,
    validityDays: 45,
    price: 16000,
    compareAtPrice: 18000,
    installmentPrice: 17000,
    installments: 2,
    makeupAllowance: 1,
    isPublic: true,
    isTrial: false,
  },
  {
    key: "private12",
    name: "12 Ders Özel Reformer",
    sessionType: "private",
    sessionCount: 12,
    validityDays: 60,
    price: 22500,
    compareAtPrice: 27000,
    installmentPrice: 24000,
    installments: 3,
    makeupAllowance: 2,
    isPublic: true,
    isTrial: false,
    description: "Düzenli çalışmak isteyenler için 12 birebir reformer dersi. Haftada iki dersle iki ayda belirgin bir fark görürsün.",
    features: ["12 birebir reformer dersi", "Kişiye özel program", "60 gün içinde kullanım", "2 telafi hakkı"],
  },
  {
    key: "duet4",
    name: "4 Ders Düet",
    sessionType: "duet",
    sessionCount: 4,
    validityDays: 30,
    price: 7200,
    compareAtPrice: null,
    installmentPrice: null,
    installments: 1,
    makeupAllowance: 0,
    isPublic: true,
    isTrial: false,
    description: "Arkadaşınla ya da eşinle iki kişilik reformer dersi. Fiyat kişi başıdır.",
    features: ["İki kişilik reformer dersi", "30 gün içinde kullanım"],
  },
  {
    key: "group8",
    name: "8 Ders Grup Reformer",
    legacyNames: ["8 Ders Grup Reformer Pilates Dersi"],
    sessionType: "group",
    sessionCount: 8,
    validityDays: 45,
    price: 6000,
    compareAtPrice: 8000,
    installmentPrice: 6900,
    installments: 3,
    makeupAllowance: 1,
    isPublic: true,
    isTrial: false,
  },
];

/** Templates this script adds (as opposed to the two it renames); removed by --reset. */
const CREATED_TEMPLATE_NAMES = TEMPLATES.filter((t) => !t.legacyNames).map((t) => t.name);

// ---- Clients and their packages ----

type ClientKey =
  | "elif" | "selin" | "zeynep" | "deniz" | "burak" | "ece" | "cem" | "merve" | "can"
  | "ayse" | "gizem" | "nazli" | "hande";

type Sale = {
  template: TemplateKey;
  daysAgo: number;
  /** Cash: paid in full. Plan: `installments` of the installment price, `paid` of them paid. */
  pay: { kind: "cash"; method: PaymentMethod } | { kind: "plan"; paid: number; method: PaymentMethod };
};

type ClientSpec = { key: ClientKey; name: string; phone: string; goals?: string; sales: Sale[]; group?: boolean };

const CLIENTS: ClientSpec[] = [
  { key: "elif", name: "Elif Yıldırım", phone: phone(1), goals: "Postür ve duruş", sales: [{ template: "private8", daysAgo: 26, pay: { kind: "cash", method: "card" } }] },
  { key: "selin", name: "Selin Aydın", phone: phone(2), goals: "Güçlenmek, esneklik", sales: [{ template: "private12", daysAgo: 20, pay: { kind: "cash", method: "bank_transfer" } }] },
  { key: "zeynep", name: "Zeynep Kaya", phone: phone(3), goals: "Bel ve sırt için güçlenmek", sales: [{ template: "private12", daysAgo: 40, pay: { kind: "plan", paid: 1, method: "bank_transfer" } }] },
  { key: "deniz", name: "Deniz Arslan", phone: phone(4), sales: [{ template: "private8", daysAgo: 40, pay: { kind: "cash", method: "cash" } }] },
  { key: "burak", name: "Burak Şahin", phone: phone(5), sales: [{ template: "duet4", daysAgo: 12, pay: { kind: "cash", method: "card" } }] },
  { key: "ece", name: "Ece Şahin", phone: phone(6), sales: [{ template: "duet4", daysAgo: 12, pay: { kind: "cash", method: "card" } }] },
  { key: "cem", name: "Cem Öztürk", phone: phone(7), goals: "Esneklik", sales: [{ template: "private8", daysAgo: 14, pay: { kind: "plan", paid: 1, method: "cash" } }] },
  {
    key: "merve",
    name: "Merve Çelik",
    phone: phone(8),
    goals: "Hamilelik sonrası toparlanmak",
    sales: [
      { template: "trial", daysAgo: 9, pay: { kind: "cash", method: "cash" } },
      { template: "private8", daysAgo: 6, pay: { kind: "cash", method: "bank_transfer" } },
    ],
  },
  { key: "can", name: "Can Demir", phone: phone(9), sales: [{ template: "private8", daysAgo: 18, pay: { kind: "cash", method: "card" } }] },
  { key: "ayse", name: "Ayşe Koç", phone: phone(10), group: true, sales: [{ template: "group8", daysAgo: 13, pay: { kind: "cash", method: "cash" } }] },
  { key: "gizem", name: "Gizem Yılmaz", phone: phone(11), group: true, sales: [{ template: "group8", daysAgo: 13, pay: { kind: "cash", method: "bank_transfer" } }] },
  { key: "nazli", name: "Nazlı Erdem", phone: phone(12), group: true, sales: [{ template: "group8", daysAgo: 8, pay: { kind: "cash", method: "card" } }] },
  { key: "hande", name: "Hande Polat", phone: phone(13), group: true, sales: [{ template: "group8", daysAgo: 5, pay: { kind: "plan", paid: 1, method: "bank_transfer" } }] },
];

// ---- Private and duet lessons ----

// a = Geldi, n = Gelmedi, l = geç iptal, u = left unmarked (Yoklama banner)
type Outcome = "a" | "n" | "l" | "u";
const OUTCOME: Record<Exclude<Outcome, "u">, AttendanceStatus> = { a: "attended", n: "no_show", l: "late_cancel" };

/** Past lessons on weekly days since the package started; the last `outcomes.length` of them, oldest first. */
type History = { clients: ClientKey[]; type: SessionType; time: string } & (
  | { weekdays: number[]; outcomes: Outcome[] }
  | { daysAgo: number[]; outcomes: Outcome[] }
);

const HISTORY: History[] = [
  { clients: ["elif"], type: "private", time: "09:00", weekdays: [1, 4], outcomes: ["a", "a", "a", "a", "a", "a"] },
  { clients: ["selin"], type: "private", time: "11:00", weekdays: [2, 5], outcomes: ["a", "a", "a", "a", "a"] },
  { clients: ["zeynep"], type: "private", time: "17:00", weekdays: [1, 3], outcomes: ["a", "a", "a", "a", "a", "l", "a"] },
  { clients: ["deniz"], type: "private", time: "19:30", weekdays: [2, 5], outcomes: ["a", "a", "n", "a", "a"] },
  { clients: ["burak", "ece"], type: "duet", time: "10:00", weekdays: [6], outcomes: ["a"] },
  { clients: ["cem"], type: "private", time: "12:00", weekdays: [1, 5], outcomes: ["a", "l", "a"] },
  { clients: ["merve"], type: "private", time: "16:00", daysAgo: [8, 2], outcomes: ["a", "u"] },
  { clients: ["can"], type: "private", time: "14:00", weekdays: [2, 5], outcomes: ["a", "a", "n", "a"] },
];

/** Today: attended once over, otherwise booked. Tomorrow: `confirmed` tapped "Geliyorum". */
const TODAY: { clients: ClientKey[]; type: SessionType; time: string }[] = [
  { clients: ["elif"], type: "private", time: "09:00" },
  { clients: ["selin"], type: "private", time: "11:00" },
  { clients: ["zeynep"], type: "private", time: "17:00" },
  { clients: ["burak", "ece"], type: "duet", time: "19:30" },
];
const TOMORROW: { clients: ClientKey[]; type: SessionType; time: string; confirmed: boolean }[] = [
  { clients: ["selin"], type: "private", time: "10:00", confirmed: true },
  { clients: ["cem"], type: "private", time: "12:00", confirmed: true },
  { clients: ["merve"], type: "private", time: "17:00", confirmed: false },
  { clients: ["deniz"], type: "private", time: "19:30", confirmed: false },
];
/** Next week, by ISO weekday (1 = Monday). */
const NEXT_WEEK: { clients: ClientKey[]; type: SessionType; weekday: number; time: string }[] = [
  { clients: ["selin"], type: "private", weekday: 1, time: "10:00" },
  { clients: ["elif"], type: "private", weekday: 1, time: "11:00" },
  { clients: ["zeynep"], type: "private", weekday: 1, time: "17:00" },
  { clients: ["can"], type: "private", weekday: 2, time: "09:00" },
  { clients: ["cem"], type: "private", weekday: 2, time: "12:00" },
  { clients: ["selin"], type: "private", weekday: 4, time: "10:00" },
  { clients: ["can"], type: "private", weekday: 5, time: "09:00" },
  { clients: ["burak", "ece"], type: "duet", weekday: 6, time: "11:00" },
];

/** Group class: fixed members join on their package's start; past attendance overrides by occurrence index. */
const GROUP_PAST_DAYS = 13;
const GROUP_OVERRIDES: Partial<Record<ClientKey, Record<number, AttendanceStatus>>> = {
  gizem: { 1: "cancelled" },
  nazli: { 2: "no_show" },
};

// ---- Workout programs ----

type Item = [name: string, sets: number | null, reps: string | null, load?: string | null, rest?: string | null, note?: string | null];
const day = (title: string, items: Item[]) => ({
  title,
  items: items.map(([name, sets, reps, load = null, rest = null, note = null]) => ({ name, sets, reps, load, rest, note })),
});

/** A gym template the trainer copies to clients; Deniz gets a copy. */
const GYM_TEMPLATE = {
  name: "Tüm vücut başlangıç · haftada 3",
  note: "Her hareketten önce 1 hafif ısınma seti. Son 2 tekrar zorlamalı ama form bozulmamalı.",
  days: [
    day("Gün A", [
      ["Goblet squat", 3, "12", "12 kg", "60 sn"],
      ["Lat pulldown", 3, "10–12", "35 kg", "60 sn"],
      ["Dumbbell bench press", 3, "10", "2 × 10 kg", "90 sn"],
      ["Glute bridge", 3, "15", null, "45 sn"],
      ["Plank", 3, "40 sn", null, "30 sn"],
    ]),
    day("Gün B", [
      ["Romanian deadlift", 3, "10", "20 kg", "90 sn", "Sırt düz, kalçayı geriye it."],
      ["Seated cable row", 3, "12", "30 kg", "60 sn"],
      ["Dumbbell shoulder press", 3, "10", "2 × 6 kg", "60 sn"],
      ["Reverse lunge", 3, "10 / bacak", null, "60 sn"],
      ["Dead bug", 3, "10", null, "30 sn"],
    ]),
    day("Gün C", [
      ["Leg press", 3, "12", "60 kg", "90 sn"],
      ["Hip thrust", 3, "12", "30 kg", "60 sn"],
      ["Şınav", 3, "8", null, "60 sn", "Zorlanırsan dizden yap."],
      ["Face pull", 3, "15", "15 kg", "45 sn"],
      ["Yan plank", 3, "30 sn", null, "30 sn"],
    ]),
  ],
};

/** Selin's reformer plan, written for her directly. */
const REFORMER_PROGRAM = {
  name: "Reformer · haftada 2",
  note: "Omuzu zorlarsa kol hareketlerinde yayı bir azalt.",
  days: [
    day("Salı", [
      ["Footwork", 1, "10 × 4 pozisyon", "3 kırmızı", null, "Topuk, parmak ucu, V, geniş."],
      ["Hundred", 1, "100 vuruş", "1 kırmızı + 1 mavi"],
      ["Bridging", 2, "8", "2 kırmızı"],
      ["Feet in straps", 1, "8 / seri", "1 kırmızı + 1 mavi"],
      ["Mermaid", 1, "4 / taraf", "1 mavi"],
    ]),
    day("Cuma", [
      ["Knee stretches", 2, "10", "2 kırmızı"],
      ["Long box pulling straps", 2, "8", "1 kırmızı"],
      ["Elephant", 2, "8", "2 kırmızı"],
      ["Side splits", 1, "8", "1 kırmızı"],
      ["Kedi-deve", 1, "8", null, null, "Dersten sonra evde de yap."],
    ]),
  ],
};
const DEMO_TEMPLATE_PROGRAMS = [GYM_TEMPLATE.name];

const BIO =
  "Ataşehir'deki stüdyomda reformer ve mat pilates dersleri veriyorum. Birebir derslerde duruşuna ve hedeflerine göre bir program kuruyoruz; " +
  "grup derslerinde en fazla sekiz kişiyle çalışıyoruz. Hamilelik ve doğum sonrası dönem için de ders planlayabiliriz.";

// -------------------------------------------------------------------------

const log = (...args: unknown[]) => console.log("·", ...args);

function mustSend(r: SendResult) {
  if (!r.ok) throw new Error(`message not sent: ${r.reason}`);
  return r.message.id;
}

async function main() {
  const [trainer] = await adminDb
    .select({ id: trainers.id, timezone: trainers.timezone })
    .from(trainers)
    .where(eq(trainers.slug, SLUG));
  if (!trainer) throw new Error(`No trainer with slug '${SLUG}'. Refusing to run.`);
  const tz = trainer.timezone;
  const trainerId = trainer.id;

  const [{ n: clientCount }] = await adminDb
    .select({ n: sql<number>`count(*)::int` })
    .from(clients)
    .where(eq(clients.trainerId, trainerId));
  if (clientCount > 0 && !RESET) {
    throw new Error(`Trainer '${SLUG}' already has ${clientCount} clients. Refusing to run (pass --reset to replace the demo data).`);
  }

  const today = todayISO(tz);
  const nowMinute = (() => {
    const [h, m] = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: tz })
      .format(new Date())
      .split(":")
      .map(Number);
    return h * 60 + m;
  })();
  const minuteOf = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

  const result = await adminDb.transaction(async (raw) => {
    const tx = raw as unknown as Tx;

    if (RESET) {
      const ids = (await tx.select({ id: clients.id }).from(clients).where(eq(clients.trainerId, trainerId))).map((c) => c.id);
      const booked =
        ids.length === 0
          ? []
          : await tx
              .selectDistinct({ lessonId: lessonAttendees.lessonId })
              .from(lessonAttendees)
              .where(and(eq(lessonAttendees.trainerId, trainerId), inArray(lessonAttendees.clientId, ids)));
      await tx.delete(clients).where(eq(clients.trainerId, trainerId));
      // Like deleteClient(): private lessons left with nobody in them go too. Group occurrences stay.
      if (booked.length > 0) {
        await tx.delete(lessons).where(
          and(
            eq(lessons.trainerId, trainerId),
            isNull(lessons.groupClassId),
            inArray(lessons.id, booked.map((b) => b.lessonId)),
            notExists(tx.select({ id: lessonAttendees.id }).from(lessonAttendees).where(eq(lessonAttendees.lessonId, lessons.id))),
          ),
        );
      }
      await tx.delete(lessonSeries).where(
        and(eq(lessonSeries.trainerId, trainerId), notExists(tx.select({ id: lessons.id }).from(lessons).where(eq(lessons.seriesId, lessonSeries.id)))),
      );
      await tx.delete(packageTemplates).where(and(eq(packageTemplates.trainerId, trainerId), inArray(packageTemplates.name, CREATED_TEMPLATE_NAMES)));
      // Clients' programs went with the clients; the demo template stays unless removed here.
      await tx.delete(programs).where(and(eq(programs.trainerId, trainerId), isNull(programs.clientId), inArray(programs.name, DEMO_TEMPLATE_PROGRAMS)));
      log(`reset: removed ${ids.length} clients and the demo templates`);
    }

    // Profile.
    await tx
      .update(trainers)
      .set({
        businessName: "Reform Pilates Ataşehir",
        headline: "Reformer ve mat pilates, birebir ve küçük gruplar",
        bio: BIO,
        city: "Ataşehir, İstanbul",
        specialties: ["Reformer", "Mat pilates", "Postür", "Hamilelik pilatesi"],
        lateCancelHours: 12,
      })
      .where(eq(trainers.id, trainerId));

    // Templates: update the trainer's two, add the rest, then order them.
    const existing = await listTemplates(tx, trainerId);
    const templateIds = {} as Record<TemplateKey, string>;
    for (const spec of TEMPLATES) {
      const { key, legacyNames, description, features, ...fields } = spec;
      const found = existing.find((t) => t.name === spec.name) ?? existing.find((t) => legacyNames?.includes(t.name));
      const input: TemplateInput = {
        ...fields,
        // Keep the trainer's own texts on the templates they wrote.
        description: description ?? found?.description ?? null,
        features: features ?? found?.features ?? [],
      };
      if (found) {
        await updateTemplate(tx, trainerId, found.id, input);
        templateIds[key] = found.id;
      } else {
        templateIds[key] = await createTemplate(tx, trainerId, input);
      }
    }
    const ordered = TEMPLATES.map((t) => templateIds[t.key]);
    const others = (await listTemplates(tx, trainerId)).map((t) => t.id).filter((id) => !ordered.includes(id));
    await reorderTemplates(tx, trainerId, [...ordered, ...others]);
    log(`templates: ${TEMPLATES.map((t) => t.name).join(", ")}`);
    const specOf = (key: TemplateKey) => TEMPLATES.find((t) => t.key === key)!;

    // Clients, packages and payments.
    const ids = {} as Record<ClientKey, string>;
    const packageIds = {} as Record<ClientKey, string[]>;
    for (const c of CLIENTS) {
      const [row] = await tx
        .insert(clients)
        .values({ trainerId, fullName: c.name, phone: c.phone, goals: c.goals ?? null })
        .returning({ id: clients.id });
      ids[c.key] = row.id;
      packageIds[c.key] = [];
      for (const sale of c.sales) {
        const t = specOf(sale.template);
        const startsOn = addDays(today, -sale.daysAgo);
        const plan = sale.pay.kind === "plan" && t.installmentPrice !== null && t.installments > 1;
        const price = plan ? t.installmentPrice! : t.price!;
        const installments = plan ? t.installments : 1;
        const pkgId = await sellPackage(tx, trainerId, {
          clientId: row.id,
          templateId: templateIds[sale.template],
          name: t.name,
          sessionType: t.sessionType,
          totalSessions: t.sessionCount,
          startsOn,
          expiresOn: expiryFor(startsOn, t.validityDays),
          price,
          makeupAllowance: t.makeupAllowance,
          installments,
          payment: null,
        });
        packageIds[c.key].push(pkgId);
        const parts = sale.pay.kind === "plan" ? installmentPlan(price, installments, startsOn).slice(0, sale.pay.paid) : [{ amount: price, dueOn: startsOn }];
        for (const part of parts) {
          const r = await recordPayment(tx, trainerId, {
            clientId: row.id,
            clientPackageId: pkgId,
            amount: part.amount,
            method: sale.pay.method,
            paidOn: part.dueOn,
            note: null,
          });
          if (!r.ok) throw new Error(`payment for ${c.name}: ${r.reason}`);
        }
      }
    }
    log(`clients: ${CLIENTS.length} with ${Object.values(packageIds).flat().length} packages`);

    // Past private/duet lessons, oldest first so package picking follows the real order.
    type Planned = { date: string; time: string; type: SessionType; clients: ClientKey[]; outcome: Outcome };
    const past: Planned[] = [];
    for (const h of HISTORY) {
      const firstSale = Math.max(...h.clients.map((k) => CLIENTS.find((c) => c.key === k)!.sales[0].daysAgo));
      const dates =
        "weekdays" in h
          ? recurringDates(addDays(today, -firstSale), addDays(today, -1), h.weekdays).slice(-h.outcomes.length)
          : h.daysAgo.map((d) => addDays(today, -d));
      if (dates.length < h.outcomes.length) throw new Error(`not enough past dates for ${h.clients.join("+")}`);
      dates.forEach((date, i) => past.push({ date, time: h.time, type: h.type, clients: h.clients, outcome: h.outcomes[i] }));
    }
    past.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

    const book = async (date: string, time: string, type: SessionType, keys: ClientKey[], status: "scheduled" | "attended") => {
      const lessonId = await createLessons(tx, trainer, {
        date,
        time,
        durationMinutes: 60,
        sessionType: type,
        clientIds: keys.map((k) => ids[k]),
        status,
        note: null,
        repeat: null,
      });
      return tx
        .select({ id: lessonAttendees.id, clientId: lessonAttendees.clientId })
        .from(lessonAttendees)
        .where(eq(lessonAttendees.lessonId, lessonId));
    };

    for (const p of past) {
      if (p.outcome === "a") {
        await book(p.date, p.time, p.type, p.clients, "attended");
        continue;
      }
      const attendees = await book(p.date, p.time, p.type, p.clients, "scheduled");
      if (p.outcome === "u") continue;
      for (const a of attendees) await setAttendance(tx, trainerId, a.id, OUTCOME[p.outcome]);
    }
    log(`past lessons: ${past.length}`);

    for (const l of TODAY) {
      const over = minuteOf(l.time) + 60 <= nowMinute;
      await book(today, l.time, l.type, l.clients, over ? "attended" : "scheduled");
    }
    const tomorrow = addDays(today, 1);
    for (const l of TOMORROW) {
      const attendees = await book(tomorrow, l.time, l.type, l.clients, "scheduled");
      if (!l.confirmed) continue;
      for (const a of attendees) await confirmAttendance(tx, { trainerId, clientId: a.clientId }, a.id);
    }
    const nextMonday = addDays(startOfWeek(today), 7);
    for (const l of NEXT_WEEK) await book(addDays(nextMonday, l.weekday - 1), l.time, l.type, l.clients, "scheduled");
    log(`today ${TODAY.length}, tomorrow ${TOMORROW.length}, next week ${NEXT_WEEK.length} private/duet lessons`);

    // Group class: start it two weeks back, fill the past occurrences, then add fixed members.
    const [group] = await tx.select().from(groupClasses).where(and(eq(groupClasses.trainerId, trainerId), isNull(groupClasses.endsOn))).limit(1);
    if (group) {
      const groupStart = addDays(today, -GROUP_PAST_DAYS);
      if (group.startsOn > groupStart) await tx.update(groupClasses).set({ startsOn: groupStart }).where(eq(groupClasses.id, group.id));
      const pastDates = recurringDates(groupStart, addDays(today, -1), group.weekdays);
      if (pastDates.length > 0) {
        await tx
          .insert(lessons)
          .values(
            pastDates.map((d) => {
              const startsAt = sql`((${d}::date + ${group.startTime}::time) at time zone ${tz})`;
              return {
                trainerId,
                groupClassId: group.id,
                occurrenceDate: d,
                capacity: group.capacity,
                title: group.title,
                sessionType: "group" as const,
                startsAt,
                endsAt: sql`${startsAt} + make_interval(mins => ${group.durationMinutes})`,
              };
            }),
          )
          .onConflictDoNothing({ target: [lessons.groupClassId, lessons.occurrenceDate] });
      }
      const occurrences = await tx
        .select({ id: lessons.id, date: lessons.occurrenceDate })
        .from(lessons)
        .where(and(eq(lessons.groupClassId, group.id), inArray(lessons.occurrenceDate, pastDates.length > 0 ? pastDates : ["1900-01-01"])))
        .orderBy(lessons.occurrenceDate);

      const members = CLIENTS.filter((c) => c.group);
      for (const m of members) {
        const joined = addDays(today, -m.sales[0].daysAgo);
        const mine = occurrences.filter((o) => o.date! >= joined);
        for (const [i, o] of mine.entries()) {
          const [a] = await tx
            .insert(lessonAttendees)
            .values({
              trainerId,
              lessonId: o.id,
              clientId: ids[m.key],
              clientPackageId: await pickPackage(tx, ids[m.key], "group", { strict: true }),
            })
            .returning({ id: lessonAttendees.id });
          await setAttendance(tx, trainerId, a.id, GROUP_OVERRIDES[m.key]?.[i] ?? "attended");
        }
        const r = await addGroupMember(tx, trainer, { classId: group.id, clientId: ids[m.key], startsOn: joined });
        if (!r.ok) throw new Error(`group member ${m.name}: ${r.reason}`);
      }
      await ensureGroupOccurrences(tx, trainer);
      log(`group '${group.title}': ${members.length} fixed members, ${occurrences.length} past occurrences`);
    } else {
      log("no live group class; skipped group members");
    }

    // Portal links for everyone (WhatsApp and portal buttons).
    const tokens = {} as Record<ClientKey, string>;
    for (const c of CLIENTS) tokens[c.key] = (await createPortalLink(tx, trainerId, ids[c.key])).token;

    // One application from the public page.
    const tpls = await listTemplates(tx, trainerId, { activeOnly: true });
    const fields = await listIntakeFields(tx, trainerId, { activeOnly: true });
    const form = new FormData();
    form.set("firstName", "Ebru");
    form.set("lastName", "Tunç");
    form.set("phone", "0555 010 20 20");
    form.set("templateId", templateIds.private8);
    form.set("installments", "1");
    form.set("message", "Merhaba, daha önce hiç reformer denemedim. Hafta içi akşamları uygunum.");
    form.set("kvkk", "on");
    for (const f of fields) {
      if (f.isHealth) continue;
      const name = `q_${f.id}`;
      if (f.type === "single_choice" && f.options.length > 0) form.set(name, f.options.find((o) => o.startsWith("Postür")) ?? f.options[0]);
      else if (f.type === "multi_choice") for (const o of f.options.filter((o) => /akşam|sonu/i.test(o)).slice(0, 2)) form.append(name, o);
      else if (f.required) {
        if (f.type === "date") form.set(name, "1992-04-18");
        else if (f.type === "number") form.set(name, String(f.min ?? 1));
        else if (f.type === "yes_no") form.set(name, "no");
        else form.set(name, "Belirtmedi");
      }
    }
    const signup = validateSignup({ trainerId, packages: tpls, fields }, form);
    if ("errors" in signup) throw new Error(`signup invalid: ${JSON.stringify(signup.errors)}`);
    const applied = await recordSignup(tx, trainerId, signup.data);
    if (applied.limited) throw new Error("signup was rate-limited");
    log("application: Ebru Tunç → 8 Ders Özel Reformer");

    // Zeynep reports the overdue installment from her page (no receipt).
    const reported = await recordClientPayment(
      tx,
      { trainerId, clientId: ids.zeynep },
      { clientPackageId: packageIds.zeynep[0], paidOn: today, note: "2. taksiti havale ettim.", receipt: null },
    );
    if (!reported.ok) throw new Error(`client payment: ${reported.reason}`);
    log(`pending transfer: Zeynep Kaya, ${reported.amount} TL (taksit ${reported.seq}/${reported.of})`);

    // Messages. Everything in one transaction shares now(), so each message gets its own time.
    const at = async (id: string, minutesAgo: number) =>
      tx.update(messages).set({ createdAt: sql`now() - make_interval(mins => ${minutesAgo})` }).where(eq(messages.id, id));
    const selin = { trainerId, clientId: ids.selin };
    const deniz = { trainerId, clientId: ids.deniz };
    const hoursToYesterday = 60 * 18;
    await at(mustSend(await sendClientMessage(tx, selin, "Merhaba hocam, yarınki derse mat getirmem gerekiyor mu?")), hoursToYesterday + 12);
    await at(mustSend(await sendTrainerMessage(tx, trainerId, ids.selin, "Merhaba Selin, gerek yok; stüdyoda mat da havlu da var. Rahat bir kıyafet yeterli.")), hoursToYesterday + 5);
    await at(mustSend(await sendClientMessage(tx, selin, "Süper, teşekkürler. Görüşürüz!")), hoursToYesterday);
    await at(mustSend(await sendTrainerMessage(tx, trainerId, ids.selin, "Bugün çok iyiydin. Omuz açma hareketini evde günde bir kez tekrarlarsan yarın farkı hissedersin.")), 95);
    await at(mustSend(await sendClientMessage(tx, selin, "Tamamdır, akşam yaparım. Yarın 10'da görüşürüz.")), 80);
    await markThreadRead(tx, trainerId, ids.selin);
    await markReadByClient(tx, selin);

    await at(mustSend(await sendClientMessage(tx, deniz, "Hocam merhaba, bu hafta bir akşam dersi daha ekleyebilir miyiz?")), 60 * 24 * 3 + 30);
    await at(mustSend(await sendTrainerMessage(tx, trainerId, ids.deniz, "Merhaba Deniz, tabii. Takvime yazdım, sayfandan görebilirsin.")), 60 * 24 * 3);
    await markThreadRead(tx, trainerId, ids.deniz);
    await markReadByClient(tx, deniz);
    await at(mustSend(await sendClientMessage(tx, deniz, "Yarınki dersi 18:30'a alabilir miyiz? İşten erken çıkabilirsem yetişirim.")), 40);
    log("messages: 2 threads, 1 unread");

    // Progress: consent, a few months of measurements and notes for three clients.
    const series: { key: ClientKey; every: number; values: Record<string, number[]> }[] = [
      { key: "selin", every: 21, values: { weight: [64.8, 64.1, 63.4, 62.9, 62.2], waist: [78, 76.5, 75, 74, 72.5], flexibility: [8, 10, 13, 15, 18], pain: [4, 3, 3, 2, 1] } },
      { key: "zeynep", every: 14, values: { weight: [71.5, 71.2, 70.4, 70.1, 69.6, 69.0], waist: [86, 85, 84, 83.5, 82, 81], pain: [6, 5, 5, 4, 3, 2] } },
      { key: "deniz", every: 28, values: { weight: [82.4, 81.0, 79.8, 79.1], bodyFat: [24.5, 23.1, 22.0, 21.2], waist: [92, 90, 88.5, 87] } },
    ];
    for (const sr of series) {
      const who = { trainerId, clientId: ids[sr.key] };
      await grantHealthConsent(tx, who);
      const n = Object.values(sr.values)[0].length;
      for (let i = 0; i < n; i++) {
        const on = addDays(today, -(n - 1 - i) * sr.every);
        const res = await saveMeasurements(tx, who, on, Object.entries(sr.values).map(([metric, v]) => ({ metric, value: v[i] })));
        if (!res.ok) throw new Error(`measurements ${sr.key}: ${res.reason}`);
      }
    }
    await addNote(tx, selin, { body: "Omuz açma hareketini evde günde bir kez tekrarla. Haftaya köprüye geçiyoruz.", visibleToClient: true });
    await addNote(tx, selin, { body: "Sağ omuzda hafif sıkışma var; yan plank kısa tutuldu.", visibleToClient: false });
    await addNote(tx, { trainerId, clientId: ids.zeynep }, { body: "Bel ağrısı 6'dan 2'ye indi. Core çalışmasına devam.", visibleToClient: true });
    log("progress: measurements for Selin, Zeynep and Deniz; 3 notes");

    // Programs: a gym template copied to Deniz, a reformer plan for Selin; both sent, with a few "Yaptım".
    await ensureExerciseLibrary(tx, trainerId);
    const input = (p: { name: string; note: string; days: ReturnType<typeof day>[] }, startsOn: string | null): ProgramInput =>
      programInputSchema.parse({ name: p.name, note: p.note, startsOn, targets: {}, days: p.days });
    const templateId = await createProgram(tx, trainerId, { ...input(GYM_TEMPLATE, null), kind: "workout", clientId: null });
    const denizProgram = await copyProgram(tx, trainerId, templateId!, ids.deniz, addDays(today, -9));
    const selinProgram = await createProgram(tx, trainerId, { ...input(REFORMER_PROGRAM, addDays(today, -14)), kind: "workout", clientId: ids.selin });
    const checkins: [ClientKey, string, number[][]][] = [
      // [day index, days ago]
      ["deniz", denizProgram!, [[0, 9], [1, 7], [2, 5], [0, 2]]],
      ["selin", selinProgram!, [[0, 10], [1, 7], [0, 3]]],
    ];
    for (const [key, programId, done] of checkins) {
      await sendProgram(tx, trainerId, programId);
      const program = await getProgram(tx, trainerId, programId);
      for (const [d, ago] of done) await setCheckin(tx, { trainerId, clientId: ids[key] }, program!.days[d].id, addDays(today, -ago), true);
    }
    log(`programs: template '${GYM_TEMPLATE.name}' → Deniz, '${REFORMER_PROGRAM.name}' → Selin`);

    return { portalFor: "Selin Aydın", token: tokens.selin, deniz: tokens.deniz };
  });

  console.log(`\nDone. Client portal (${result.portalFor}): /p/${result.token}`);
  console.log(`Deniz Arslan (gym program): /p/${result.deniz}`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => pg.end());
