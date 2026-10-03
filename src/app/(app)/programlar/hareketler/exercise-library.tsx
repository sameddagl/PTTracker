"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { PlayCircle, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog";
import { NativeSelect } from "@/components/field";
import { MuscleMap } from "@/components/muscle-map";
import { PersonChip } from "@/components/person-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Exercise } from "@/db/programs";
import { MUSCLES, type MuscleKey } from "@/lib/muscles";
import { archiveExerciseAction, saveExerciseAction } from "../actions";

type Draft = { id: string | null; name: string; category: string; videoUrl: string; note: string; primary: MuscleKey[]; secondary: MuscleKey[] };
const toDraft = (e?: Exercise): Draft => ({
  id: e?.id ?? null,
  name: e?.name ?? "",
  category: e?.category ?? "",
  videoUrl: e?.videoUrl ?? "",
  note: e?.note ?? "",
  primary: e?.primary ?? [],
  secondary: e?.secondary ?? [],
});

/** One tap on the figure: none → primary → secondary → none. */
function cycle(d: Draft, m: MuscleKey): Draft {
  if (d.primary.includes(m)) return { ...d, primary: d.primary.filter((x) => x !== m), secondary: [...d.secondary, m] };
  if (d.secondary.includes(m)) return { ...d, secondary: d.secondary.filter((x) => x !== m) };
  return { ...d, primary: [...d.primary, m] };
}

const names = (list: MuscleKey[]) => list.map((m) => MUSCLES[m]).join(", ");

/** The library as a grid per category: name, muscles and the figure; a card opens the editor. */
export function ExerciseLibrary({
  exercises,
  categories,
  canCreate = true,
  editableIds,
  makers = {},
}: {
  exercises: Exercise[];
  categories: string[];
  /** May add new exercises. */
  canCreate?: boolean;
  /** Exercises this member may change (all when left out). */
  editableIds?: string[];
  /** Studios: who added a custom exercise, by id. */
  makers?: Record<string, { name: string; color: string }>;
}) {
  const editable = new Set(editableIds ?? exercises.map((e) => e.id));
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Draft | null>(null);

  const groups = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase("tr");
    const shown = needle
      ? exercises.filter(
          (e) => e.name.toLocaleLowerCase("tr").includes(needle) || [...e.primary, ...e.secondary].some((m) => MUSCLES[m].toLocaleLowerCase("tr").includes(needle)),
        )
      : exercises;
    const by = new Map<string, Exercise[]>();
    for (const e of shown) {
      const k = e.category ?? "Diğer";
      (by.get(k) ?? by.set(k, []).get(k)!).push(e);
    }
    return [...by.entries()].sort(([a], [b]) => (categories.indexOf(a) + 1 || 99) - (categories.indexOf(b) + 1 || 99));
  }, [exercises, q, categories]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Hareket ya da kas ara</span>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Hareket ya da kas ara" className="pl-10" />
        </label>
        {canCreate && (
          <Button type="button" onClick={() => setEditing(toDraft())}>
            <Plus />
            Ekle
          </Button>
        )}
      </div>

      {groups.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">“{q}” ile eşleşen hareket yok.</p>}

      {groups.map(([cat, list]) => (
        <section key={cat} aria-labelledby={`cat-${cat}`}>
          <h2 id={`cat-${cat}`} className="mb-3 flex items-baseline gap-2 text-base font-semibold">
            {cat}
            <span className="text-xs font-normal text-muted-foreground tabular-nums">{list.length}</span>
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {list.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  disabled={!editable.has(e.id)}
                  onClick={() => setEditing(toDraft(e))}
                  className="flex h-full w-full flex-col gap-3 rounded-2xl border bg-card p-3 text-left shadow-card transition-shadow outline-none hover:shadow-float focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block text-sm leading-snug font-semibold">{e.name}</span>
                      <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                        {e.primary.length > 0 ? names(e.primary) : "Kas seçilmedi"}
                      </span>
                    </span>
                    {e.videoUrl && <PlayCircle className="size-4 shrink-0 text-muted-foreground" aria-label="Video var" />}
                  </span>
                  {makers[e.id] && (
                    <span className="self-start">
                      <PersonChip name={makers[e.id].name} color={makers[e.id].color} />
                    </span>
                  )}
                  <MuscleMap primary={e.primary} secondary={e.secondary} compact className="mt-auto rounded-xl bg-canvas px-3 py-2" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <ExerciseEditor draft={editing} setDraft={setEditing} categories={categories} />
    </div>
  );
}

function ExerciseEditor({ draft: d, setDraft, categories }: { draft: Draft | null; setDraft: (d: Draft | null) => void; categories: string[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [pending, start] = useTransition();
  const { confirm, dialog } = useConfirm();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (d && !el.open) el.showModal();
    if (!d && el.open) el.close();
  }, [d]);

  const close = () => setDraft(null);

  function save(x: Draft) {
    start(async () => {
      const res = await saveExerciseAction({ ...x, category: x.category || null });
      if (!res.ok) return void toast.error(res.error);
      toast.success(x.id ? "Hareket güncellendi" : `“${x.name.trim()}” eklendi`);
      close();
    });
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="exercise-editor-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => e.target === ref.current && close()}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-3xl border bg-card p-0 text-foreground shadow-float backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      {dialog}
      {d && (
        <form
          className="flex flex-col gap-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            save(d);
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="exercise-editor-title" className="text-lg font-semibold">
              {d.id ? "Hareketi düzenle" : "Yeni hareket"}
            </h2>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Kapat" onClick={close}>
              <X />
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Adı
              <Input value={d.name} onChange={(e) => setDraft({ ...d, name: e.target.value })} maxLength={80} required autoFocus={!d.id} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Kategori
              <NativeSelect value={d.category} onChange={(e) => setDraft({ ...d, category: e.target.value })}>
                <option value="">Diğer</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </NativeSelect>
            </label>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl bg-muted/40 p-4">
            <p className="text-sm font-medium">
              Çalışan kaslar <span className="block text-xs font-normal text-muted-foreground">Kasa dokun: bir kez ana kas, iki kez yardımcı, üç kez kaldır.</span>
            </p>
            <MuscleMap primary={d.primary} secondary={d.secondary} onToggle={(m) => setDraft(cycle(d, m))} className="mx-auto w-full max-w-sm" />
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Video linki <span className="text-xs font-normal text-muted-foreground">isteğe bağlı · YouTube, Instagram ya da başka bir https linki</span>
            <Input value={d.videoUrl} onChange={(e) => setDraft({ ...d, videoUrl: e.target.value })} inputMode="url" placeholder="https://" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Not <span className="text-xs font-normal text-muted-foreground">isteğe bağlı</span>
            <Input value={d.note} onChange={(e) => setDraft({ ...d, note: e.target.value })} maxLength={300} placeholder="Sırt düz, nefesi tutma." />
          </label>
          <div className="flex flex-wrap justify-end gap-2">
            {d.id && (
              <Button
                type="button"
                variant="ghost"
                className="mr-auto text-destructive-strong hover:text-destructive-strong"
                disabled={pending}
                onClick={async () => {
                  if (!(await confirm({ title: `“${d.name}” silinsin mi?`, body: "Programlardaki adı kalır.", confirmLabel: "Sil", destructive: true }))) return;
                  start(async () => {
                    const res = await archiveExerciseAction(d.id!);
                    if (!res.ok) toast.error(res.error);
                    else close();
                  });
                }}
              >
                Sil
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={close}>
              Vazgeç
            </Button>
            <Button type="submit" loading={pending} disabled={!d.name.trim()}>
              Kaydet
            </Button>
          </div>
        </form>
      )}
    </dialog>
  );
}
