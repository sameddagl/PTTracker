"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// In-app replacement for window.confirm / window.prompt. The browser's own
// dialogs don't show (or answer "no" on their own) in home-screen apps,
// in-app browsers and some embedded views, which silently broke actions like
// archiving. Usage:
//   const { confirm, dialog } = useConfirm();
//   if (!(await confirm({ title: "…", confirmLabel: "Arşive al" }))) return;
//   …  return <>{dialog}…</>;

type Options = {
  title: string;
  body?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Ask for a note as well; the promise resolves to the text ("" when left empty). */
  input?: { label: string; placeholder?: string; maxLength?: number };
};

type Pending = Options & { resolve: (value: string | boolean | null) => void };

export function useConfirm() {
  const [pending, setPending] = useState<Pending | null>(null);
  const ref = useRef<HTMLDialogElement>(null);
  const [text, setText] = useState("");

  useEffect(() => {
    const d = ref.current;
    if (pending && d && !d.open) d.showModal();
  }, [pending]);

  const close = useCallback(
    (value: string | boolean | null) => {
      pending?.resolve(value);
      ref.current?.close();
      setPending(null);
      setText("");
    },
    [pending],
  );

  /** Resolves true when confirmed, false when cancelled. */
  const confirm = useCallback(
    (opts: Omit<Options, "input">) => new Promise<boolean>((resolve) => setPending({ ...opts, resolve: (v) => resolve(v === true) })),
    [],
  );

  /** Resolves to the typed text when confirmed, null when cancelled. */
  const ask = useCallback(
    (opts: Options & { input: NonNullable<Options["input"]> }) =>
      new Promise<string | null>((resolve) => setPending({ ...opts, resolve: (v) => resolve(typeof v === "string" ? v : null) })),
    [],
  );

  const dialog = (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault();
        close(pending?.input ? null : false);
      }}
      onClick={(e) => {
        // A click on the backdrop (the dialog element itself, outside the panel) cancels.
        if (e.target === ref.current) close(pending?.input ? null : false);
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border bg-card p-0 text-foreground shadow-float backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      {pending && (
        <form
          method="dialog"
          className="flex flex-col gap-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            close(pending.input ? text.trim() : true);
          }}
        >
          <h2 id="confirm-title" className="text-lg font-semibold">
            {pending.title}
          </h2>
          {pending.body && <div className="text-sm leading-relaxed text-muted-foreground">{pending.body}</div>}
          {pending.input && (
            <label className="flex flex-col gap-2 text-sm font-medium">
              {pending.input.label}
              <Textarea
                autoFocus
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={pending.input.placeholder}
                maxLength={pending.input.maxLength}
              />
            </label>
          )}
          <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => close(pending.input ? null : false)}>
              {pending.cancelLabel ?? "Vazgeç"}
            </Button>
            <Button type="submit" variant={pending.destructive ? "destructive" : "default"} autoFocus={!pending.input}>
              {pending.confirmLabel ?? "Tamam"}
            </Button>
          </div>
        </form>
      )}
    </dialog>
  );

  return { confirm, ask, dialog };
}
