import { CalendarCheck, CalendarDays, Plus, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * A static, decorative miniature of the Bugün screen. The screen is dark in
 * both colour schemes (it reads as a device, not as part of the page), so its
 * colours are fixed values rather than theme tokens. Hidden from assistive
 * tech because the surrounding copy already says what it shows; its 10–11px
 * labels are deliberate for a scaled-down phone.
 */

type Status = "geldi" | "gelmedi" | "gec" | "iptal";

const STATUS: Record<Status, { label: string; pill: string; bar: string }> = {
  geldi: { label: "Geldi", pill: "bg-[#22c55e]/15 text-[#4ade80]", bar: "bg-[#4ade80]" },
  gelmedi: { label: "Gelmedi", pill: "bg-[#f87171]/15 text-[#fca5a5]", bar: "bg-[#f87171]" },
  gec: { label: "Geç iptal", pill: "bg-[#f59e0b]/15 text-[#fbbf24]", bar: "bg-[#fbbf24]" },
  iptal: { label: "İptal", pill: "bg-white/10 text-white/60", bar: "bg-white/25" },
};

const LESSONS: { time: string; end: string; name: string; kind: string; status: Status }[] = [
  { time: "09:00", end: "10:00", name: "Zeynep K.", kind: "Özel · Reformer", status: "geldi" },
  { time: "11:00", end: "12:00", name: "Mert A.", kind: "Özel · Mat", status: "gelmedi" },
  { time: "17:00", end: "18:00", name: "Ayşe D.", kind: "Düet · Reformer", status: "gec" },
];

function StatusBar() {
  return (
    <div className="flex h-7 items-center justify-between px-3 text-[11px] font-semibold text-white">
      <span className="tabular-nums">20:41</span>
      <span className="h-[22px] w-[76px] rounded-full bg-black" />
      <span className="flex items-center gap-1">
        <span className="flex items-end gap-px">
          {[4, 6, 8, 10].map((h) => (
            <span key={h} className="w-[3px] rounded-sm bg-white" style={{ height: h }} />
          ))}
        </span>
        <span className="ml-1 flex h-[11px] w-[22px] items-center rounded-[3px] border border-white/50 p-px">
          <span className="h-full w-3/4 rounded-[1.5px] bg-white" />
        </span>
      </span>
    </div>
  );
}

export function PhoneMockup({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("relative mx-auto w-[288px] select-none sm:w-[304px]", className)}>
      {/* Bezel */}
      <div className="rounded-[3rem] bg-[#0b0b0c] p-[9px] shadow-[0_50px_100px_-40px_rgb(0_0_0/0.55),0_30px_60px_-30px_rgb(0_0_0/0.35)] ring-1 ring-black/10 dark:ring-white/15">
        <div className="relative h-[600px] overflow-hidden rounded-[2.45rem] bg-[#111113] pt-2 text-white">
          <StatusBar />

          <div className="px-4 pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] text-white/55">Salı, 6 Ekim</p>
                <p className="mt-0.5 text-[19px] leading-tight font-semibold tracking-[-0.02em]">İyi akşamlar, Elif</p>
              </div>
              <span className="flex size-9 items-center justify-center rounded-full bg-white/10 text-[12px] font-semibold">
                EÖ
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-[18px] bg-[#1c1c1f] p-3">
                <p className="text-[10px] text-white/55">Bugün</p>
                <p className="mt-1.5 flex items-baseline gap-1">
                  <span className="text-[26px] leading-none font-semibold tracking-[-0.03em] tabular-nums">4</span>
                  <span className="text-[11px] text-white/60">ders</span>
                </p>
              </div>
              <div className="rounded-[18px] bg-[#c6f24e] p-3 text-[#111113]">
                <p className="text-[10px] font-medium text-[#111113]/70">Bekleyen alacak</p>
                <p className="mt-1.5 text-[22px] leading-none font-semibold tracking-[-0.03em] tabular-nums">₺6.166</p>
              </div>
            </div>

            <div className="mt-5 mb-2 flex items-center justify-between">
              <p className="text-[12px] font-semibold">Dersler</p>
              <p className="text-[10px] text-white/50">1 bekliyor</p>
            </div>

            <ul className="flex flex-col gap-1.5">
              {LESSONS.map((l) => {
                const s = STATUS[l.status];
                return (
                  <li key={l.time} className="relative flex items-center gap-3 overflow-hidden rounded-[16px] bg-[#1c1c1f] py-2.5 pr-2.5 pl-4">
                    <span className={cn("absolute inset-y-2.5 left-1.5 w-[3px] rounded-full", s.bar)} />
                    <span className="w-9 shrink-0 text-[11px] leading-tight font-semibold tabular-nums">
                      {l.time}
                      <span className="block font-normal text-white/45">{l.end}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-medium">{l.name}</span>
                      <span className="block truncate text-[10px] text-white/50">{l.kind}</span>
                    </span>
                    <span className={cn("shrink-0 rounded-full px-2 py-1 text-[10px] font-medium", s.pill)}>{s.label}</span>
                  </li>
                );
              })}

              {/* The upcoming lesson, waiting for its one-tap attendance. */}
              <li className="relative overflow-hidden rounded-[16px] bg-[#1c1c1f] py-2.5 pr-2.5 pl-4 ring-1 ring-[#c6f24e]/40">
                <span className="absolute inset-y-2.5 left-1.5 w-[3px] rounded-full bg-[#c6f24e]" />
                <div className="flex items-center gap-3">
                  <span className="w-9 shrink-0 text-[11px] leading-tight font-semibold tabular-nums">
                    19:30
                    <span className="block font-normal text-white/45">20:30</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium">Can E.</span>
                    <span className="block truncate text-[10px] text-white/50">8 Ders Özel · 1 ders kaldı</span>
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[10px] font-medium">
                  {(["geldi", "gelmedi", "gec", "iptal"] as const).map((k, i) => (
                    <span
                      key={k}
                      className={cn("rounded-full py-1.5", i === 0 ? "bg-[#c6f24e] text-[#111113]" : "bg-white/[0.07] text-white/70")}
                    >
                      {STATUS[k].label}
                    </span>
                  ))}
                </div>
              </li>
            </ul>
          </div>

          {/* Floating pill tab bar */}
          <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-2 px-4">
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-[#232326]/95 p-1.5 shadow-[0_12px_30px_-10px_rgb(0_0_0/0.8)]">
              <span className="flex h-9 items-center gap-1.5 rounded-full bg-[#c6f24e] px-3.5 text-[11px] font-semibold text-[#111113]">
                <CalendarCheck className="size-3.5" strokeWidth={2.4} />
                Bugün
              </span>
              {[Users, CalendarDays, Wallet].map((Icon, i) => (
                <span key={i} className="flex size-9 items-center justify-center rounded-full text-white/60">
                  <Icon className="size-4" />
                </span>
              ))}
            </div>
            <span className="flex size-12 items-center justify-center rounded-full border border-white/10 bg-[#232326]/95 text-white shadow-[0_12px_30px_-10px_rgb(0_0_0/0.8)]">
              <Plus className="size-5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
