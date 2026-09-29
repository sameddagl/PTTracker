"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatShortDate } from "@/lib/format";
import type { FormState } from "@/lib/forms";
import { addTimeOffAction, deleteTimeOffAction } from "./actions";

export function TimeOff({ items, today }: { items: { id: string; startsOn: string; endsOn: string; note: string | null }[]; today: string }) {
  const [state, action, pending] = useActionState<FormState<"startsOn" | "endsOn">, FormData>(addTimeOffAction, {});
  const [removing, startTransition] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  const e = state.errors ?? {};

  useEffect(() => {
    if (state.savedAt) toast.success("İzin eklendi");
  }, [state.savedAt]);

  return (
    <div className="flex flex-col gap-3">
      {items.length > 0 && (
        <ul className="divide-y rounded-xl border">
          {items.map((o) => (
            <li key={o.id} className="flex items-center gap-3 py-2 pr-2 pl-4 text-sm">
              <span className="flex-1">
                {o.startsOn === o.endsOn ? formatShortDate(o.startsOn) : `${formatShortDate(o.startsOn)} – ${formatShortDate(o.endsOn)}`}
                {o.note && <span className="text-muted-foreground"> · {o.note}</span>}
              </span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={removing}
                aria-label="İzni sil"
                onClick={() => startTransition(() => deleteTimeOffAction(o.id))}
              >
                <Trash2 className="text-muted-foreground" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <form ref={form} action={action} className="flex flex-col gap-3 rounded-xl border p-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Field id="startsOn" label="Başlangıç" error={e.startsOn}>
            <Input id="startsOn" name="startsOn" type="date" min={today} />
          </Field>
          <Field id="endsOn" label="Bitiş" hint="tek gün ise boş bırak" error={e.endsOn}>
            <Input id="endsOn" name="endsOn" type="date" min={today} />
          </Field>
        </div>
        <Field id="offNote" label="Not" hint="isteğe bağlı">
          <Input id="offNote" name="note" maxLength={100} placeholder="Örn. bayram" />
        </Field>
        <Button type="submit" variant="outline" loading={pending} className="self-start">
          İzin ekle
        </Button>
      </form>
    </div>
  );
}
