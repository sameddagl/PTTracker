"use client";

import { useId, useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Plus, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_MEALS, NUTRITION_DISCLAIMER, NUTRITION_TARGETS } from "@/lib/programs";
import { cn } from "@/lib/utils";
import { saveProgramAction } from "./actions";

type Kind = "workout" | "nutrition";
type Item = { key: string; exerciseId: string | null; name: string; sets: string; reps: string; load: string; rest: string; note: string; showNote: boolean; focusNote?: boolean };
type Day = { key: string; title: string; items: Item[] };

export type EditorInitial = {
  name: string;
  note: string | null;
  startsOn: string | null;
  targets: Record<string, string>;
  days: {
    title: string;
    items: { exerciseId: string | null; name: string; sets: number | null; reps: string | null; load: string | null; rest: string | null; note: string | null }[];
  }[];
};

let seq = 0;
const key = () => `k${++seq}`;
const blankItem = (): Item => ({ key: key(), exerciseId: null, name: "", sets: "", reps: "", load: "", rest: "", note: "", showNote: false });
const dayTitle = (kind: Kind, n: number) => (kind === "workout" ? `Gün ${String.fromCharCode(65 + n)}` : (DEFAULT_MEALS[n] ?? `Öğün ${n + 1}`));

function move<T>(list: T[], from: number, to: number) {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
}

export function ProgramEditor({
  kind,
  initial,
  library,
  target,
  forClient,
}: {
  kind: Kind;
  initial: EditorInitial | null;
  library: { id: string; name: string; category: string | null }[];
  target: { id?: string; clientId?: string | null; next?: string };
  /** The client's first name when this is their program (shows the start date). */
  forClient?: string;
}) {
  const listId = useId();
  const workout = kind === "workout";
  const [name, setName] = useState(initial?.name ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [startsOn, setStartsOn] = useState(initial?.startsOn ?? "");
  const [targets, setTargets] = useState<Record<string, string>>(initial?.targets ?? {});
  const [days, setDays] = useState<Day[]>(() =>
    initial && initial.days.length > 0
      ? initial.days.map((d) => ({
          key: key(),
          title: d.title,
          items: d.items.map((i) => ({
            key: key(),
            exerciseId: i.exerciseId,
            name: i.name,
            sets: i.sets ? String(i.sets) : "",
            reps: i.reps ?? "",
            load: i.load ?? "",
            rest: i.rest ?? "",
            note: i.note ?? "",
            showNote: Boolean(i.note),
          })),
        }))
      : workout
        ? [{ key: key(), title: dayTitle(kind, 0), items: [blankItem()] }]
        : DEFAULT_MEALS.slice(0, 4).map((t) => ({ key: key(), title: t, items: [blankItem()] })),
  );
  const [pending, start] = useTransition();
  const byName = new Map(library.map((e) => [e.name.toLocaleLowerCase("tr"), e.id]));

  const setDay = (d: number, patch: Partial<Day>) => setDays((all) => all.map((x, i) => (i === d ? { ...x, ...patch } : x)));
  const setItem = (d: number, n: number, patch: Partial<Item>) =>
    setDays((all) => all.map((x, i) => (i === d ? { ...x, items: x.items.map((it, j) => (j === n ? { ...it, ...patch } : it)) } : x)));

  function save() {
    const payload = {
      name,
      note,
      startsOn: forClient ? startsOn || null : null,
      targets: workout ? {} : Object.fromEntries(Object.entries(targets).filter(([, v]) => v.trim())),
      days: days.map((d) => ({
        title: d.title,
        items: d.items
          .filter((i) => i.name.trim())
          .map((i) => ({
            exerciseId: i.exerciseId,
            name: i.name,
            sets: i.sets.trim() ? Number.parseInt(i.sets, 10) || null : null,
            reps: i.reps,
            load: i.load,
            rest: i.rest,
            note: i.note,
          })),
      })),
    };
    start(async () => {
      const res = await saveProgramAction({ ...target, kind }, payload);
      if (res && !res.ok) toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {workout && (
        <datalist id={listId}>
          {library.map((e) => (
            <option key={e.id} value={e.name}>
              {e.category ?? ""}
            </option>
          ))}
        </datalist>
      )}

      <section className="flex flex-col gap-4 surface p-4 sm:p-5">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {workout ? "Programın adı" : "Planın adı"}
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder={workout ? "Başlangıç tüm vücut, haftada 3 gün" : "Günlük beslenme planı"} required />
        </label>
        {forClient && (
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Başlangıç
            <Input type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} className="max-w-48" />
          </label>
        )}
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Açıklama <span className="text-xs font-normal text-muted-foreground">isteğe bağlı</span>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder={workout ? "Isınma 10 dk; hareketler arasında su iç." : "Öğün saatlerini kaçırma, akşam 20:00'den sonra yeme."}
          />
        </label>
        {!workout && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {NUTRITION_TARGETS.map((t) => (
              <label key={t.key} className="flex flex-col gap-1.5 text-sm font-medium">
                {t.label}
                <Input value={targets[t.key] ?? ""} onChange={(e) => setTargets((v) => ({ ...v, [t.key]: e.target.value }))} maxLength={40} placeholder={t.placeholder} />
              </label>
            ))}
          </div>
        )}
      </section>

      {days.map((d, di) => (
        <section key={d.key} aria-label={d.title || dayTitle(kind, di)} className="flex flex-col gap-3 surface p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Input
              value={d.title}
              onChange={(e) => setDay(di, { title: e.target.value })}
              maxLength={60}
              aria-label={workout ? "Günün adı" : "Öğünün adı"}
              className="font-semibold"
            />
            <Button type="button" size="icon-sm" variant="ghost" aria-label="Yukarı taşı" disabled={di === 0} onClick={() => setDays((all) => move(all, di, di - 1))}>
              <ChevronUp />
            </Button>
            <Button type="button" size="icon-sm" variant="ghost" aria-label="Aşağı taşı" disabled={di === days.length - 1} onClick={() => setDays((all) => move(all, di, di + 1))}>
              <ChevronDown />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="text-muted-foreground"
              aria-label={workout ? "Günü sil" : "Öğünü sil"}
              disabled={days.length === 1}
              onClick={() => setDays((all) => all.filter((_, i) => i !== di))}
            >
              <Trash2 />
            </Button>
          </div>

          <ol className="flex flex-col gap-3">
            {d.items.map((it, ii) => (
              <li key={it.key} className="flex flex-col gap-2 rounded-2xl bg-muted/50 p-3">
                <div className="flex items-start gap-2">
                  <span className="mt-3 w-5 shrink-0 text-center text-xs text-muted-foreground tabular-nums">{ii + 1}</span>
                  {workout ? (
                    <Input
                      list={listId}
                      value={it.name}
                      onChange={(e) => setItem(di, ii, { name: e.target.value, exerciseId: byName.get(e.target.value.trim().toLocaleLowerCase("tr")) ?? null })}
                      maxLength={80}
                      placeholder="Hareket ara ya da yaz"
                      aria-label="Hareket"
                      className="bg-card"
                    />
                  ) : (
                    <Textarea
                      value={it.name}
                      onChange={(e) => setItem(di, ii, { name: e.target.value })}
                      maxLength={300}
                      rows={2}
                      placeholder="2 haşlanmış yumurta, beyaz peynir, domates, salatalık"
                      aria-label="Öğünde ne var"
                      className="bg-card"
                    />
                  )}
                </div>
                {workout && (
                  <div className="grid grid-cols-2 gap-2 pl-7 sm:grid-cols-4">
                    {(
                      [
                        ["sets", "Set", "3", 2, "numeric"],
                        ["reps", "Tekrar", "10–12", 20, "text"],
                        ["load", "Ağırlık / yay", "20 kg", 30, "text"],
                        ["rest", "Dinlenme", "60 sn", 20, "text"],
                      ] as const
                    ).map(([field, label, ph, max, mode]) => (
                      <label key={field} className="flex min-w-0 flex-col gap-1 text-xs font-medium text-muted-foreground">
                        <span className="truncate">{label}</span>
                        <Input
                          value={it[field]}
                          onChange={(e) => setItem(di, ii, { [field]: e.target.value })}
                          maxLength={max}
                          inputMode={mode}
                          placeholder={ph}
                          className="h-10 bg-card px-3 text-sm md:h-9"
                        />
                      </label>
                    ))}
                  </div>
                )}
                {it.showNote && (
                  <Input
                    value={it.note}
                    onChange={(e) => setItem(di, ii, { note: e.target.value })}
                    maxLength={300}
                    placeholder={workout ? "Dizler ayak ucunu geçmesin, yavaş in." : "Not"}
                    aria-label="Not"
                    className="ml-7 w-[calc(100%-1.75rem)] bg-card"
                    autoFocus={it.focusNote}
                  />
                )}
                <div className="flex items-center gap-1 pl-7">
                  {!it.showNote && (
                    <button
                      type="button"
                      onClick={() => setItem(di, ii, { showNote: true, focusNote: true })}
                      className="inline-flex min-h-9 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <StickyNote className="size-3.5" aria-hidden />
                      Not ekle
                    </button>
                  )}
                  <span className="ml-auto flex">
                    <Button type="button" size="icon-sm" variant="ghost" aria-label="Yukarı taşı" disabled={ii === 0} onClick={() => setDay(di, { items: move(d.items, ii, ii - 1) })}>
                      <ChevronUp />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Aşağı taşı"
                      disabled={ii === d.items.length - 1}
                      onClick={() => setDay(di, { items: move(d.items, ii, ii + 1) })}
                    >
                      <ChevronDown />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="text-muted-foreground"
                      aria-label="Sil"
                      onClick={() => setDay(di, { items: d.items.filter((_, j) => j !== ii) })}
                    >
                      <Trash2 />
                    </Button>
                  </span>
                </div>
              </li>
            ))}
          </ol>
          <Button type="button" variant="outline" className="self-start" onClick={() => setDay(di, { items: [...d.items, blankItem()] })}>
            <Plus />
            {workout ? "Hareket ekle" : "Satır ekle"}
          </Button>
        </section>
      ))}

      <Button
        type="button"
        variant="ghost"
        className={cn("self-start", days.length >= 14 && "hidden")}
        onClick={() => setDays((all) => [...all, { key: key(), title: dayTitle(kind, all.length), items: [blankItem()] }])}
      >
        <Plus />
        {workout ? "Gün ekle" : "Öğün ekle"}
      </Button>

      {!workout && <p className="rounded-2xl bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">{NUTRITION_DISCLAIMER} Bu satır danışanın sayfasında planın altında görünür.</p>}

      <Button type="button" size="lg" onClick={save} loading={pending} disabled={!name.trim()} className="w-full sm:w-auto sm:self-start">
        Kaydet
      </Button>
    </div>
  );
}
