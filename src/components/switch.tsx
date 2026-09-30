"use client";

import { cn } from "@/lib/utils";

/** On/off switch with a 44px hit area; the label is for screen readers. */
export function Switch({ on, label, onChange, disabled }: { on: boolean; label: string; onChange: (v: boolean) => void; disabled?: boolean }) {
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
