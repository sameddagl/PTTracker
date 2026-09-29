"use client";

import { useActionState, useEffect, useState } from "react";
import { Copy, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Field, FormError, NativeSelect } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WEEKDAY_LABELS } from "@/lib/dates";
import type { FormState } from "@/lib/forms";
import { toHHMM, toMinutes } from "@/lib/slots";
import { submitWithoutReset } from "@/lib/use-form-submit";
import { saveAvailabilityAction, type AvailabilityField } from "./actions";

type Range = { start: string; end: string };
type Week = Record<number, Range[]>;

const FULL_DAY_NAMES = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

export type AvailabilityInitial = {
  bookingEnabled: boolean;
  bookingLessonMinutes: number;
  bookingMinNoticeHours: number;
  bookingHorizonDays: number;
  rules: { weekday: number; startMinute: number; endMinute: number }[];
};

export function AvailabilityForm({ initial }: { initial: AvailabilityInitial }) {
  const [state, action, pending] = useActionState<FormState<AvailabilityField>, FormData>(saveAvailabilityAction, {});
  const e = state.errors ?? {};
  const [enabled, setEnabled] = useState(initial.bookingEnabled);
  const [week, setWeek] = useState<Week>(() => {
    const w: Week = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
    for (const r of initial.rules) w[r.weekday].push({ start: toHHMM(r.startMinute), end: toHHMM(r.endMinute === 1440 ? 1439 : r.endMinute) });
    return w;
  });

  useEffect(() => {
    if (state.savedAt) toast.success("Müsaitlik kaydedildi");
  }, [state.savedAt]);

  const update = (day: number, fn: (ranges: Range[]) => Range[]) => setWeek((w) => ({ ...w, [day]: fn(w[day]) }));
  const rules = Object.entries(week).flatMap(([day, ranges]) =>
    ranges
      .filter((r) => r.start && r.end)
      .map((r) => ({ weekday: Number(day), startMinute: toMinutes(r.start), endMinute: r.end === "23:59" ? 1440 : toMinutes(r.end) })),
  );

  function copyToWeekdays(from: number) {
    setWeek((w) => ({ ...w, 1: [...w[from]], 2: [...w[from]], 3: [...w[from]], 4: [...w[from]], 5: [...w[from]] }));
    toast("Hafta içi günlere kopyalandı");
  }

  return (
    <form onSubmit={submitWithoutReset(action)} className="flex flex-col gap-6" noValidate>
      <input type="hidden" name="rules" value={JSON.stringify(rules)} />

      <label className="flex items-start gap-3 rounded-xl border p-4">
        <input
          type="checkbox"
          name="bookingEnabled"
          checked={enabled}
          onChange={(ev) => setEnabled(ev.target.checked)}
          className="mt-0.5 size-4 accent-[var(--primary)]"
        />
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Danışanlar randevu alabilsin</span>
          <span className="text-xs text-muted-foreground">
            Birebir paketi olan danışanlar kendi sayfalarından aşağıdaki saatlerde boş olan saatleri görüp ders alabilir.
          </span>
        </span>
      </label>

      <div className="grid grid-cols-3 gap-3">
        <Field id="bookingLessonMinutes" label="Ders süresi" error={e.bookingLessonMinutes}>
          <NativeSelect id="bookingLessonMinutes" name="bookingLessonMinutes" defaultValue={initial.bookingLessonMinutes}>
            {[30, 45, 50, 55, 60, 75, 90].map((m) => (
              <option key={m} value={m}>
                {m} dk
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="bookingMinNoticeHours" label="En az önceden" error={e.bookingMinNoticeHours}>
          <NativeSelect id="bookingMinNoticeHours" name="bookingMinNoticeHours" defaultValue={initial.bookingMinNoticeHours}>
            {[0, 1, 2, 3, 6, 12, 24, 48].map((h) => (
              <option key={h} value={h}>
                {h === 0 ? "Hemen" : `${h} saat`}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="bookingHorizonDays" label="Kaç gün ileri" error={e.bookingHorizonDays}>
          <NativeSelect id="bookingHorizonDays" name="bookingHorizonDays" defaultValue={initial.bookingHorizonDays}>
            {[7, 14, 21, 30, 60].map((d) => (
              <option key={d} value={d}>
                {d} gün
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Haftalık çalışma saatleri</legend>
        <FormError message={e.rules} />
        <ul className="divide-y rounded-xl border">
          {FULL_DAY_NAMES.map((name, i) => {
            const day = i + 1;
            const ranges = week[day];
            return (
              <li key={day} className="flex flex-col gap-2 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={ranges.length ? "text-sm font-medium" : "text-sm text-muted-foreground"}>
                    <span className="sm:hidden">{WEEKDAY_LABELS[i]}</span>
                    <span className="max-sm:hidden">{name}</span>
                    {ranges.length === 0 && <span className="ml-2 text-xs">kapalı</span>}
                  </span>
                  <span className="flex gap-1">
                    {ranges.length > 0 && day <= 5 && (
                      <Button type="button" size="sm" variant="ghost" onClick={() => copyToWeekdays(day)} aria-label={`${name} saatlerini hafta içine kopyala`}>
                        <Copy />
                        <span className="max-sm:sr-only">Hafta içine</span>
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => update(day, (r) => [...r, r.length ? { start: r.at(-1)!.end, end: "21:00" } : { start: "09:00", end: "13:00" }])}
                      aria-label={`${name} için aralık ekle`}
                    >
                      <Plus />
                    </Button>
                  </span>
                </div>
                {ranges.map((r, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Input
                      type="time"
                      step={900}
                      value={r.start}
                      aria-label={`${name} ${j + 1}. aralık başlangıç`}
                      onChange={(ev) => update(day, (rs) => rs.map((x, k) => (k === j ? { ...x, start: ev.target.value } : x)))}
                      className="max-w-32"
                    />
                    <span className="text-muted-foreground">–</span>
                    <Input
                      type="time"
                      step={900}
                      value={r.end}
                      aria-label={`${name} ${j + 1}. aralık bitiş`}
                      onChange={(ev) => update(day, (rs) => rs.map((x, k) => (k === j ? { ...x, end: ev.target.value } : x)))}
                      className="max-w-32"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`${name} ${j + 1}. aralığı sil`}
                      onClick={() => update(day, (rs) => rs.filter((_, k) => k !== j))}
                    >
                      <X />
                    </Button>
                  </div>
                ))}
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted-foreground">
          Randevular her aralığın başından itibaren ders süresi kadar arka arkaya açılır. Zaten dersin olan saatler otomatik kapanır.
        </p>
      </fieldset>

      <Button type="submit" size="lg" disabled={pending} className="sm:self-start">
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </Button>
    </form>
  );
}
