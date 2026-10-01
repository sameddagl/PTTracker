"use client";

import { useMemo, useState, useTransition } from "react";
import { PlayCircle, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog";
import { NativeSelect } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Exercise } from "@/db/programs";
import { archiveExerciseAction, saveExerciseAction } from "../actions";

type Draft = { id: string | null; name: string; category: string; videoUrl: string; note: string };
const toDraft = (e?: Exercise): Draft => ({ id: e?.id ?? null, name: e?.name ?? "", category: e?.category ?? "", videoUrl: e?.videoUrl ?? "", note: e?.note ?? "" });

export function ExerciseLibrary({ exercises, categories }: { exercises: Exercise[]; categories: string[] }) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Draft | null>(null);
  const [pending, start] = useTransition();
  const { confirm, dialog } = useConfirm();

  const groups = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase("tr");
    const shown = needle ? exercises.filter((e) => e.name.toLocaleLowerCase("tr").includes(needle)) : exercises;
    const by = new Map<string, Exercise[]>();
    for (const e of shown) {
      const k = e.category ?? "Diğer";
      (by.get(k) ?? by.set(k, []).get(k)!).push(e);
    }
    return [...by.entries()].sort(([a], [b]) => (categories.indexOf(a) + 1 || 99) - (categories.indexOf(b) + 1 || 99));
  }, [exercises, q, categories]);

  function save(d: Draft) {
    start(async () => {
      const res = await saveExerciseAction({ ...d, category: d.category || null });
      if (!res.ok) return void toast.error(res.error);
      toast.success(d.id ? "Hareket güncellendi" : `“${d.name.trim()}” eklendi`);
      setEditing(null);
    });
  }

  const form = (d: Draft) => (
    <form
      className="flex flex-col gap-3 rounded-2xl bg-muted/50 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        save(d);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Adı
          <Input value={d.name} onChange={(e) => setEditing({ ...d, name: e.target.value })} maxLength={80} required autoFocus className="bg-card" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Kategori
          <NativeSelect value={d.category} onChange={(e) => setEditing({ ...d, category: e.target.value })}>
            <option value="">Diğer</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </NativeSelect>
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Video linki <span className="text-xs font-normal text-muted-foreground">isteğe bağlı · YouTube, Instagram ya da başka bir https linki</span>
        <Input value={d.videoUrl} onChange={(e) => setEditing({ ...d, videoUrl: e.target.value })} inputMode="url" placeholder="https://" className="bg-card" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Not <span className="text-xs font-normal text-muted-foreground">isteğe bağlı</span>
        <Input value={d.note} onChange={(e) => setEditing({ ...d, note: e.target.value })} maxLength={300} placeholder="Sırt düz, nefesi tutma." className="bg-card" />
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
                else setEditing(null);
              });
            }}
          >
            Sil
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
          Vazgeç
        </Button>
        <Button type="submit" loading={pending} disabled={!d.name.trim()}>
          Kaydet
        </Button>
      </div>
    </form>
  );

  return (
    <div className="flex flex-col gap-6">
      {dialog}
      <div className="flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Hareket ara</span>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ara" className="pl-10" />
        </label>
        <Button type="button" onClick={() => setEditing(toDraft())}>
          <Plus />
          Ekle
        </Button>
      </div>
      {editing && !editing.id && form(editing)}
      {groups.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">“{q}” ile eşleşen hareket yok.</p>}
      {groups.map(([cat, list]) => (
        <section key={cat} aria-label={cat}>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{cat}</h2>
          <ul className="divide-y overflow-hidden surface">
            {list.map((e) => (
              <li key={e.id} className="px-2 py-1">
                {editing?.id === e.id ? (
                  <div className="py-2">{form(editing)}</div>
                ) : (
                  <button type="button" onClick={() => setEditing(toDraft(e))} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 text-left text-sm hover:bg-muted/50">
                    <span className="flex-1 font-medium">{e.name}</span>
                    {e.videoUrl && <PlayCircle className="size-4 text-muted-foreground" aria-label="Video var" />}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
