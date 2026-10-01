import { Activity, ArrowDown, Check, CheckCheck, FileSpreadsheet, FileText, Lock, UserPlus } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { MuscleMap } from "@/components/muscle-map";
import { MUSCLES, type MuscleKey } from "@/lib/muscles";
import { APP_DOMAIN } from "@/lib/config";
import { cn } from "@/lib/utils";

/*
 * Small, static mini-UIs shown inside the feature cards. They are decorative
 * (aria-hidden by the card) and built from theme tokens so they follow light
 * and dark mode. Everything stays at 12px or larger for legibility.
 */

const panel = "rounded-2xl border bg-card shadow-card";

export function AttendanceDemo() {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className={cn(panel, "p-3")}>
        <div className="flex items-center gap-3">
          <Avatar name="Zeynep K." size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Zeynep K.</p>
            <p className="text-xs text-muted-foreground tabular-nums">09:00 · Özel Reformer</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1 text-center text-xs font-medium">
          {["Geldi", "Gelmedi", "Geç iptal", "İptal"].map((l, i) => (
            <span
              key={l}
              className={cn(
                "flex items-center justify-center gap-1 rounded-full py-1.5 whitespace-nowrap",
                i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {i === 0 && <Check className="size-3" strokeWidth={3} />}
              {l}
            </span>
          ))}
        </div>
      </div>
      <div className={cn(panel, "flex items-center gap-3 p-3")}>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-medium text-foreground">8 Ders Özel</span>
            <span className="text-muted-foreground tabular-nums">4 / 8 kaldı</span>
          </div>
          <div className="mt-2 flex gap-1">
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < 4 ? "bg-foreground" : i === 4 ? "bg-lime" : "bg-muted")} />
            ))}
          </div>
        </div>
        <span className="rounded-full bg-lime px-2 py-1 text-xs font-semibold text-lime-foreground tabular-nums">−1</span>
      </div>
    </div>
  );
}

export function PublicPageDemo() {
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex h-9 items-center gap-2 rounded-full border bg-card px-4 text-sm shadow-card">
        <Lock className="size-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">{APP_DOMAIN}/</span>
        <span className="-ml-2 font-medium">elif-pilates</span>
      </div>
      <div className={cn(panel, "flex w-full items-center gap-3 p-3")}>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-lime text-lime-foreground">
          <UserPlus className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Yeni başvuru</p>
          <p className="truncate text-xs text-muted-foreground">Deniz Y. · 12 Ders Özel</p>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">02:14</span>
      </div>
      <div className={cn(panel, "flex w-[88%] items-center gap-3 p-3 opacity-60")}>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
          <Check className="size-4 text-success-strong" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">KVKK onayı alındı</p>
          <p className="truncate text-xs text-muted-foreground">Deniz Y. · formu doldurdu</p>
        </div>
      </div>
    </div>
  );
}

export function PricingDemo() {
  return (
    <div className={cn(panel, "w-full p-4")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">12 Ders Özel Reformer</p>
          <p className="text-xs text-muted-foreground">3 ay geçerli</p>
        </div>
        <span className="rounded-full bg-lime px-2 py-1 text-xs font-semibold whitespace-nowrap text-lime-foreground">%33 indirim</span>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-[-0.03em] tabular-nums">₺4.000</span>
        <s className="text-sm text-muted-foreground tabular-nums">₺6.000</s>
      </div>
      <div className="my-3 border-t border-dashed" />
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">ya da 3 taksit</span>
        <span className="font-medium tabular-nums">3 × ₺1.333</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1 text-center text-xs tabular-nums">
        {["6 Eki", "6 Kas", "6 Ara"].map((d, i) => (
          <span key={d} className={cn("rounded-lg py-1.5", i === 0 ? "bg-success/10 text-success-strong" : "bg-muted text-muted-foreground")}>
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

export function GroupDemo() {
  const members = ["Zeynep K.", "Ayşe D.", "Mert A.", "Can E.", "Deniz Y."];
  return (
    <div className={cn(panel, "w-full p-4")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Grup Reformer</p>
          <p className="text-xs text-muted-foreground tabular-nums">Sal, Per · 18:00</p>
        </div>
        <span className="text-sm font-semibold tabular-nums">
          5<span className="font-normal text-muted-foreground">/8</span>
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-5/8 rounded-full bg-foreground" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex -space-x-2">
          {members.map((m) => (
            <Avatar key={m} name={m} size="sm" className="ring-2 ring-card" />
          ))}
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-8 rounded-full border border-dashed border-input bg-card" />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">3 yer boş</span>
      </div>
    </div>
  );
}

export function BookingDemo() {
  const slots = [
    { t: "09:00", state: "taken" },
    { t: "10:00", state: "free" },
    { t: "11:00", state: "free" },
    { t: "12:00", state: "selected" },
    { t: "14:00", state: "free" },
    { t: "15:00", state: "taken" },
  ] as const;
  return (
    <div className={cn(panel, "w-full p-4")}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Perşembe, 8 Ekim</p>
        <p className="text-xs text-muted-foreground">Elif Ö.</p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-sm tabular-nums">
        {slots.map((s) => (
          <span
            key={s.t}
            className={cn(
              "rounded-full border py-1.5",
              s.state === "selected" && "border-primary bg-primary font-medium text-primary-foreground",
              s.state === "free" && "bg-card",
              s.state === "taken" && "border-transparent bg-muted text-muted-foreground line-through",
            )}
          >
            {s.t}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-xs">
        <span className="text-muted-foreground">24 saat öncesine kadar ücretsiz iptal</span>
        <Check className="size-3.5 text-success-strong" />
      </div>
    </div>
  );
}

export function PaymentDemo() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="relative max-w-[92%] self-end rounded-2xl rounded-tr-md bg-[#d9fdd3] px-3 pt-2 pb-1.5 text-sm text-[#111b21] shadow-card dark:bg-[#005c4b] dark:text-[#e9edef]">
        Merhaba Zeynep, paketinde 1 ders kaldı 🙂
        <span className="mt-0.5 flex items-center justify-end gap-1 text-xs text-[#111b21]/60 dark:text-[#e9edef]/70">
          10:02
          <CheckCheck className="size-3.5 text-[#1f8fd8] dark:text-[#53bdeb]" />
        </span>
      </div>
      <div className={cn(panel, "flex items-center gap-3 p-3")}>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
          <FileText className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Dekont · ₺1.333</p>
          <p className="truncate text-xs text-muted-foreground">Zeynep K. · 2. taksit</p>
        </div>
        <span className="rounded-full bg-warning/10 px-2 py-1 text-xs font-medium whitespace-nowrap text-warning-strong">
          Onay bekliyor
        </span>
      </div>
    </div>
  );
}

/** A lock-screen style notification, as it lands on the phone. */
function Notification({ title, body, time }: { title: string; body: string; time: string }) {
  return (
    <div className={cn(panel, "flex items-start gap-3 rounded-[1.1rem] p-3")}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[0.7rem] bg-lime text-lime-foreground">
        <Activity className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline justify-between gap-2 text-sm font-medium">
          <span className="truncate">{title}</span>
          <span className="shrink-0 text-xs font-normal text-muted-foreground">{time}</span>
        </p>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

export function ConfirmDemo() {
  return (
    <div className="flex w-full flex-col gap-3">
      <Notification title="Yarın 10:00 dersin var" body="Özel Reformer · Elif Ö. Geliyor musun?" time="şimdi" />
      <div className={cn(panel, "p-3")}>
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">Yarınki dersler</span>
          <span className="text-muted-foreground tabular-nums">3/4 onayladı</span>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {[
            ["Zeynep K.", "10:00", true],
            ["Mert A.", "18:00", false],
          ].map(([name, time, ok]) => (
            <div key={name as string} className="flex items-center gap-2">
              <Avatar name={name as string} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm">{name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{time}</span>
              {ok ? (
                <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success-strong">
                  <Check className="size-3" strokeWidth={3} />
                  Geliyor
                </span>
              ) : (
                <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">Bekleniyor</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MessagesDemo() {
  return (
    <div className="flex w-full flex-col gap-2">
      <Notification title="Zeynep K." body="Yarınki dersi 11:00'e alabilir miyiz?" time="09:12" />
      <div className="flex flex-col gap-1.5 px-1 pt-1">
        <span className="max-w-[80%] self-start rounded-2xl rounded-bl-md bg-card px-3 py-2 text-sm shadow-card">
          Yarınki dersi 11:00&apos;e alabilir miyiz?
        </span>
        <span className="max-w-[80%] self-end rounded-2xl rounded-br-md bg-primary px-3 py-2 text-sm text-primary-foreground">
          Olur, 11:00&apos;e aldım 🙂
        </span>
        <span className="self-end pr-1 text-xs text-muted-foreground">Görüldü</span>
      </div>
    </div>
  );
}

export function ImportDemo() {
  const rows = [
    ["Zeynep Kaya", "0532 …", "6"],
    ["Mert Aksoy", "0541 …", "2"],
    ["Ayşe Demir", "0555 …", "10"],
  ];
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div className={cn(panel, "w-full overflow-hidden")}>
        <div className="flex items-center gap-2 border-b bg-muted/60 px-3 py-2 text-xs font-medium">
          <FileSpreadsheet className="size-3.5 text-success-strong" />
          danisanlar.xlsx
        </div>
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-3 py-2 text-xs">
          {["Ad soyad", "Telefon", "Kalan"].map((h) => (
            <span key={h} className="pb-1 text-muted-foreground">
              {h}
            </span>
          ))}
          {rows.flat().map((c, i) => (
            <span key={i} className={cn("py-0.5 tabular-nums", i % 3 === 0 && "truncate font-medium")}>
              {c}
            </span>
          ))}
        </div>
      </div>
      <ArrowDown className="size-4 text-muted-foreground" />
      <div className="flex items-center gap-2 rounded-full bg-lime px-3 py-1.5 text-xs font-semibold text-lime-foreground">
        <Check className="size-3.5" strokeWidth={3} />
        24 danışan ve paketleri eklendi
      </div>
    </div>
  );
}


/** Metric tiles and a weight line with a lime fill, like the İlerlemem tab. */
export function ProgressDemo() {
  const pts = [
    [8, 18],
    [62, 30],
    [116, 44],
    [170, 52],
    [224, 66],
  ];
  const line = `M${pts.map((p) => p.join(",")).join(" L")}`;
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        {[
          ["Kilo", "62,2", "kg", "−2,6 kg"],
          ["Bel", "72,5", "cm", "−5,5 cm"],
        ].map(([label, v, unit, d], i) => (
          <div key={label} className={cn(panel, "p-3", i === 0 && "ring-2 ring-lime")}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-lg leading-none font-semibold tabular-nums">
              {v} <span className="text-xs font-medium text-muted-foreground">{unit}</span>
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground tabular-nums">{d}</span> · 3 ayda
            </p>
          </div>
        ))}
      </div>
      <div className={cn(panel, "p-3")}>
        <svg viewBox="0 0 232 76" className="h-20 w-full text-foreground">
          <defs>
            <linearGradient id="demo-progress" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--lime)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--lime)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${line} L224,76 L8,76 Z`} fill="url(#demo-progress)" />
          <path d={line} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {pts.map(([x, y], i) => (
            <circle key={x} cx={x} cy={y} r={i === pts.length - 1 ? 5 : 3} fill={i === pts.length - 1 ? "var(--lime)" : "var(--card)"} stroke="currentColor" strokeWidth="2" />
          ))}
        </svg>
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>8 Tem</span>
          <span>19 Ağu</span>
          <span>30 Eyl</span>
        </div>
      </div>
    </div>
  );
}

/** One day of a workout program on the client's page, with "yaptım". */
export function ProgramDemo() {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex gap-1.5 text-xs font-medium">
        <span className="rounded-full bg-foreground px-3 py-1.5 text-background">Gün A</span>
        <span className="rounded-full bg-card px-3 py-1.5 text-muted-foreground shadow-card">Gün B</span>
      </div>
      {[
        ["Goblet squat", "3 × 10–12 · 12 kg"],
        ["Hip thrust", "3 × 12 · 30 kg"],
        ["Plank", "3 × 45 sn"],
      ].map(([name, sum], i) => (
        <div key={name} className={cn(panel, "flex items-center gap-3 p-2.5")}>
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-lime text-xs font-semibold text-lime-foreground tabular-nums">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{name}</p>
            <p className="text-xs text-muted-foreground tabular-nums">{sum}</p>
          </div>
        </div>
      ))}
      <span className="flex items-center justify-center gap-1.5 rounded-full bg-primary py-2 text-xs font-medium text-primary-foreground">
        <Check className="size-3.5" strokeWidth={3} />
        Bugünkü antrenmanı yaptım
      </span>
    </div>
  );
}

/** A nutrition plan: daily targets and a meal. */
export function NutritionDemo() {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        {[
          ["Su", "2,5 lt"],
          ["Protein", "90 g"],
          ["Adım", "8.000"],
        ].map(([l, v]) => (
          <div key={l} className={cn(panel, "p-2.5")}>
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className="text-sm font-semibold tabular-nums">{v}</p>
          </div>
        ))}
      </div>
      {[
        ["Kahvaltı", ["2 haşlanmış yumurta, beyaz peynir", "Domates, salatalık"]],
        ["Öğle", ["Izgara tavuk, bulgur pilavı, salata"]],
      ].map(([meal, lines]) => (
        <div key={meal as string} className={cn(panel, "p-3")}>
          <p className="text-sm font-semibold">{meal}</p>
          {(lines as string[]).map((l) => (
            <p key={l} className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-1.5 shrink-0 rounded-full bg-lime" />
              {l}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

/** The installment reminder as it lands on the phone, and the box at the top of the client's page. */
export function InstallmentDemo() {
  return (
    <div className="flex w-full flex-col gap-3">
      <Notification title="Reform Pilates" body="Yarın 12 Ders Özel paketinin 2. taksidi var: ₺8.000." time="10:00" />
      <div className="flex items-center gap-3 rounded-2xl bg-lime p-3 text-lime-foreground">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-lime-foreground text-lime">
          <FileText className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tabular-nums">2. taksit bugün · ₺8.000</p>
          <p className="text-xs opacity-80">Havale bilgileri ve “Ödedim” için dokun</p>
        </div>
      </div>
    </div>
  );
}

/** A day's muscles on the body figure, as the client sees it on Programım. */
export function BodyMapDemo() {
  return (
    <div className={cn(panel, "w-full p-4")}>
      <p className="mb-3 text-sm font-semibold">Bu antrenmanda çalışan kaslar</p>
      <MuscleMap
        primary={["gluteal", "quadriceps", "upper-back", "abs"]}
        secondary={["hamstring", "biceps", "front-deltoids", "obliques"]}
        className="mx-auto max-w-xs"
      />
    </div>
  );
}

/** Exercise rows with their own small figure. */
export function ExerciseCardsDemo() {
  const rows: { name: string; sum: string; primary: MuscleKey[]; secondary: MuscleKey[] }[] = [
    { name: "Hip thrust", sum: "3 × 12 · 30 kg", primary: ["gluteal"], secondary: ["hamstring"] },
    { name: "Low row", sum: "3 × 10 · 35 kg", primary: ["upper-back"], secondary: ["biceps", "back-deltoids"] },
    { name: "Pec deck", sum: "3 × 12 · 25 kg", primary: ["chest"], secondary: ["front-deltoids"] },
  ];
  return (
    <div className="flex w-full flex-col gap-2">
      {rows.map((r, i) => (
        <div key={r.name} className={cn(panel, "flex items-center gap-3 p-3")}>
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-lime text-xs font-semibold text-lime-foreground tabular-nums">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{r.name}</p>
            <p className="text-xs text-muted-foreground tabular-nums">{r.sum}</p>
            <p className="text-xs text-muted-foreground">{r.primary.map((m) => MUSCLES[m]).join(" · ")}</p>
          </div>
          <MuscleMap primary={r.primary} secondary={r.secondary} compact className="w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}
