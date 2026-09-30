"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { NotifyPrefs } from "@/lib/notify-prefs";
import { cn } from "@/lib/utils";

type Row = { kind: string; label: string; hint: string; push: boolean; email: boolean | null };
type Result = { ok: true } | { ok: false; error: string };

function Switch({ on, label, onChange, disabled }: { on: boolean; label: string; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      // 44px tall hit area around a 28px track.
      className="flex h-11 w-12 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
    >
      <span className={cn("relative h-7 w-12 rounded-full transition-colors", on ? "bg-primary" : "bg-muted ring-1 ring-border ring-inset")}>
        <span
          className={cn(
            "absolute top-1 left-1 size-5 rounded-full shadow-sm transition-transform",
            on ? "translate-x-5 bg-primary-foreground" : "bg-card",
          )}
        />
      </span>
    </button>
  );
}

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
