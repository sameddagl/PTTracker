"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Field, FormError } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WEEKDAY_LABELS } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { createGroupAction, updateGroupAction, type GroupFormState } from "./actions";

const chip =
  "flex min-h-11 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring";

const MODES = [
  {
    value: "both",
    title: "Sabit yer + boş yerlere katılım",
    text: "Sabit üyelerin yeri her hafta ayrılır. Kalan ya da boşalan yerlere danışanlar kendi katılır.",
  },
  { value: "fixed", title: "Sadece sabit yer", text: "Üyeleri sen belirlersin; gelemeyeceği hafta iptal eder. Başkası katılamaz." },
  { value: "drop_in", title: "Derse tek tek katılım", text: "Sabit üye yok. Grup paketi olan danışan istediği derse yer ayırır." },
] as const;

export type GroupValues = {
  title: string;
  capacity: string;
  joinMode: string;
  weekdays?: string;
  startTime?: string;
  durationMinutes?: string;
  startsOn?: string;
};

/** New group class, or (with `id`) the editable part of an existing one. */
export function GroupForm({ id, initial }: { id?: string; initial: GroupValues }) {
  const [state, action, pending] = useActionState<GroupFormState, FormData>(id ? updateGroupAction.bind(null, id) : createGroupAction, {});
  const v = { ...initial, ...state.values };
  const e = state.errors ?? {};
  const days = new Set((v.weekdays ?? "").split(",").filter(Boolean).map(Number));

  useEffect(() => {
    if (state.savedAt) toast.success("Grup dersi güncellendi");
  }, [state.savedAt]);

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <FormError message={e.form} />
      <Field id="title" label="Ders adı" error={e.title}>
        <Input id="title" name="title" placeholder="Örn. Grup Reformer" defaultValue={v.title} />
      </Field>

      {!id && (
        <>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Günler</legend>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAY_LABELS.map((label, i) => (
                <label key={label} className={cn(chip, "h-11 text-xs")}>
                  <input type="checkbox" name="weekdays" value={i + 1} defaultChecked={days.has(i + 1)} className="sr-only" />
                  {label}
                </label>
              ))}
            </div>
            {e.weekdays && <p className="mt-2 text-sm text-destructive-strong">{e.weekdays}</p>}
          </fieldset>
          <div className="grid grid-cols-2 gap-4">
            <Field id="startTime" label="Saat" error={e.startTime}>
              <Input id="startTime" name="startTime" type="time" step={300} defaultValue={v.startTime} />
            </Field>
            <Field id="durationMinutes" label="Süre (dk)" error={e.durationMinutes}>
              <Input id="durationMinutes" name="durationMinutes" type="number" inputMode="numeric" min={15} defaultValue={v.durationMinutes} />
            </Field>
            <Field id="startsOn" label="Başlangıç" error={e.startsOn}>
              <Input id="startsOn" name="startsOn" type="date" defaultValue={v.startsOn} />
            </Field>
            <Field id="capacity" label="Kapasite" hint="kişi" error={e.capacity}>
              <Input id="capacity" name="capacity" type="number" inputMode="numeric" min={1} defaultValue={v.capacity} />
            </Field>
          </div>
        </>
      )}
      {id && (
        <Field id="capacity" label="Kapasite" hint="kişi" error={e.capacity}>
          <Input id="capacity" name="capacity" type="number" inputMode="numeric" min={1} defaultValue={v.capacity} className="max-w-32" />
        </Field>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Danışanlar nasıl katılsın?</legend>
        <div className="flex flex-col gap-2">
          {MODES.map((m) => (
            <label
              key={m.value}
              className="flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
            >
              <input
                type="radio"
                name="joinMode"
                value={m.value}
                defaultChecked={v.joinMode === m.value}
                className="mt-1 size-4 accent-[var(--primary)]"
              />
              <span>
                <span className="block text-sm font-medium">{m.title}</span>
                <span className="block text-sm text-muted-foreground">{m.text}</span>
              </span>
            </label>
          ))}
        </div>
        {e.joinMode && <p className="mt-2 text-sm text-destructive-strong">{e.joinMode}</p>}
      </fieldset>

      <Button type="submit" size="lg" loading={pending} className="sm:self-start">
        {id ? "Kaydet" : "Grup dersini oluştur"}
      </Button>
    </form>
  );
}
