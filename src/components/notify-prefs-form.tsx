"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { NotifyPrefs } from "@/lib/notify-prefs";
import { Switch } from "@/components/switch";

type Row = { kind: string; label: string; hint: string; push: boolean; email: boolean | null };
type Result = { ok: true } | { ok: false; error: string };

/** Per-kind push / e-mail switches. Every change saves at once. */
export function NotifyPrefsForm({ rows: initial, save }: { rows: Row[]; save: (prefs: NotifyPrefs) => Promise<Result> }) {
  const [rows, setRows] = useState(initial);
  const [pending, start] = useTransition();

  function set(kind: string, channel: "push" | "email", value: boolean) {
    const before = rows;
    const next = rows.map((r) => (r.kind === kind ? { ...r, [channel]: value } : r));
    setRows(next);
    const prefs: NotifyPrefs = Object.fromEntries(
      next.map((r) => [r.kind, { push: r.push, ...(r.email === null ? {} : { email: r.email }) }]),
    );
    start(async () => {
      const res = await save(prefs);
      if (!res.ok) {
        setRows(before);
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="overflow-hidden surface">
      <div className="flex items-center gap-2 border-b px-4 py-2 text-xs font-medium text-muted-foreground">
        <span className="flex-1">Ne zaman</span>
        <span className="w-12 text-center">Bildirim</span>
        <span className="w-12 text-center">E-posta</span>
      </div>
      <ul className="divide-y">
        {rows.map((r) => (
          <li key={r.kind} className="flex items-center gap-2 py-2 pr-2 pl-4">
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{r.label}</span>
              <span className="block text-xs text-muted-foreground">{r.hint}</span>
            </span>
            <Switch on={r.push} label={`${r.label}: bildirim`} onChange={(v) => set(r.kind, "push", v)} disabled={pending} />
            {r.email === null ? (
              <span className="w-12 text-center text-xs text-muted-foreground" aria-label="E-posta ile gönderilmez">
                —
              </span>
            ) : (
              <Switch on={r.email} label={`${r.label}: e-posta`} onChange={(v) => set(r.kind, "email", v)} disabled={pending} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
