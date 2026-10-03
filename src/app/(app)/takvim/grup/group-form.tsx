"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Field, FormError, NativeSelect } from "@/components/field";
import { FormSubmit } from "@/components/form-submit";
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
    text: "Sabit üyelerin yeri her hafta ayrılır. Boş kalan yerlere başka danışanlar da yazılabilir.",
  },
  { value: "fixed", title: "Sabit yer", text: "Üyeleri sen seçersin; gelemeyen o haftayı iptal eder. Başka kimse katılamaz." },
  { value: "drop_in", title: "Derse tek tek katılım", text: "Sabit üye yok. Grup paketi olan danışan istediği derse yazılır." },
] as const;

export type GroupValues = {
  title: string;
  capacity: string;
  joinMode: string;
  weekdays?: string;
  startTime?: string;
  durationMinutes?: string;
  startsOn?: string;
  instructorId?: string;
};

/** New group class, or (with `id`) the editable part of an existing one. */
export function GroupForm({ id, initial, instructors = [] }: { id?: string; initial: GroupValues; /** Studio members (empty for a trainer working alone). */ instructors?: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<GroupFormState, FormData>(id ? updateGroupAction.bind(null, id) : createGroupAction, {});
  const v = { ...initial, ...state.values };
  const e = state.errors ?? {};
  // Controlled so the submit button knows whether at least one day is picked.
  const [days, setDays] = useState(() => new Set((initial.weekdays ?? "").split(",").filter(Boolean).map(Number)));
  const toggleDay = (d: number) =>
    setDays((prev) => {
      const next = new Set(prev);
      if (!next.delete(d)) next.add(d);
      return next;
    });

  useEffect(() => {
    if (state.savedAt) toast.success("Grup dersi güncellendi");
  }, [state.savedAt]);

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <FormError message={e.form} />
      <Field id="title" label="Ders adı" error={e.title}>
        <Input
          id="title"
          name="title"
          placeholder="Örn. Grup Reformer"
          required
          minLength={2}
          maxLength={60}
          data-invalid-message="Ders adı en az 2 karakter olmalı."
          defaultValue={v.title}
        />
      </Field>

      {!id && (
        <>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Günler</legend>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAY_LABELS.map((label, i) => (
                <label key={label} className={cn(chip, "h-11 text-xs")}>
                  <input
                    type="checkbox"
                    name="weekdays"
                    value={i + 1}
                    checked={days.has(i + 1)}
                    onChange={() => toggleDay(i + 1)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
            {e.weekdays ? (
              <p className="mt-2 text-sm text-destructive-strong">{e.weekdays}</p>
            ) : (
              days.size === 0 && <p className="mt-2 text-sm text-muted-foreground">En az bir gün seç.</p>
            )}
          </fieldset>
          <div className="grid grid-cols-2 gap-4">
            <Field id="startTime" label="Saat" error={e.startTime}>
              <Input id="startTime" name="startTime" type="time" required data-missing-message="Saat seç." defaultValue={v.startTime} />
            </Field>
            <Field id="durationMinutes" label="Süre (dk)" error={e.durationMinutes}>
              <Input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                inputMode="numeric"
                required
                min={15}
                max={240}
                step={1}
                data-invalid-message="Süre 15 ile 240 dakika arasında olmalı."
                defaultValue={v.durationMinutes}
              />
            </Field>
            <Field id="startsOn" label="Başlangıç" error={e.startsOn}>
              <Input id="startsOn" name="startsOn" type="date" required data-missing-message="Başlangıç tarihi seç." defaultValue={v.startsOn} />
            </Field>
            <Field id="capacity" label="Kapasite" hint="kişi" error={e.capacity}>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                inputMode="numeric"
                required
                min={1}
                max={100}
                step={1}
                data-invalid-message="Kapasite 1 ile 100 arasında olmalı."
                defaultValue={v.capacity}
              />
            </Field>
          </div>
        </>
      )}
      {id && (
        <Field id="capacity" label="Kapasite" hint="kişi" error={e.capacity}>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            inputMode="numeric"
            required
            min={1}
            max={100}
            step={1}
            data-invalid-message="Kapasite 1 ile 100 arasında olmalı."
            defaultValue={v.capacity}
            className="max-w-32"
          />
        </Field>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Danışanlar nasıl katılsın?</legend>
        <div className="flex flex-col gap-2">
          {MODES.map((m) => (
            <label
              key={m.value}
              className="flex cursor-pointer items-start gap-3 surface px-4 py-3 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
            >
              <input
                type="radio"
                name="joinMode"
                value={m.value}
                required
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

      {instructors.length > 1 && (
        <Field id="instructorId" label="Eğitmen" hint={id ? "değişirse ileriki dersler de yeni eğitmene geçer" : undefined}>
          <NativeSelect id="instructorId" name="instructorId" defaultValue={v.instructorId} className="max-w-72">
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      )}

      <FormSubmit size="lg" loading={pending} disabled={!id && days.size === 0} className="sm:self-start">
        {id ? "Kaydet" : "Grup dersini oluştur"}
      </FormSubmit>
    </form>
  );
}
