"use client";

import { useState, type FormEvent } from "react";
import { FieldError } from "@/components/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { answerName, type IntakeFieldDef } from "@/lib/intake";

const chip =
  "flex min-h-11 cursor-pointer items-center justify-center rounded-full border px-4 py-2 text-sm transition-colors has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring group-has-[[aria-invalid=true]]/choice:border-destructive";

// Digits with Turkish separators ("72,5", "1.250"), as parseTRY reads them.
const NUMBER_PATTERN = String.raw`[\s₺+\-0-9.,]*[0-9][\s₺0-9.,]*`;

/** One trainer-defined question, rendered for its type. */
export function IntakeInput({
  field,
  error,
  defaultValues = [],
  disabled,
  plainLabel,
}: {
  field: IntakeFieldDef & { id: string };
  error?: string;
  /** Current answer as form values (see answerToRaw), when editing. */
  defaultValues?: string[];
  disabled?: boolean;
  /** No "required"/"optional" marker (the trainer editing answers). */
  plainLabel?: boolean;
}) {
  const name = answerName(field.id);
  const first = defaultValues[0] ?? "";
  const id = `f-${field.id}`;
  // Only the client filling in the form must answer; the trainer may leave gaps.
  const required = field.required && !plainLabel && !disabled;
  // A required multi-choice needs one tick: keep `required` on the boxes only while none is ticked.
  const [ticked, setTicked] = useState(() => field.options.filter((o) => defaultValues.includes(o)).length);
  const described = field.helpText ? `${id}-help` : undefined;
  const label = (
    <>
      {field.label}
      {plainLabel ? null : field.required ? (
        <span className="text-destructive-strong"> *</span>
      ) : (
        <span className="font-normal text-muted-foreground"> · isteğe bağlı</span>
      )}
    </>
  );

  // The error under a choice group tracks its first option; picking another one must update it too.
  const relayChange = (ev: FormEvent<HTMLDivElement>) => {
    const firstOption = document.getElementById(id);
    if (firstOption && ev.target !== firstOption) firstOption.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const control = (() => {
    switch (field.type) {
      case "short_text":
        return (
          <Input id={id} name={name} maxLength={200} defaultValue={first} disabled={disabled} required={required} aria-describedby={described} />
        );
      case "long_text":
        return (
          <Textarea
            id={id}
            name={name}
            rows={3}
            maxLength={2000}
            defaultValue={first}
            disabled={disabled}
            required={required}
            aria-describedby={described}
          />
        );
      case "number":
        return (
          <div className="flex items-center gap-2">
            <Input
              id={id}
              name={name}
              inputMode="decimal"
              pattern={NUMBER_PATTERN}
              data-invalid-message="Bir sayı gir."
              className="max-w-32"
              defaultValue={first}
              disabled={disabled}
              required={required}
              aria-describedby={described}
            />
            {field.unit && <span className="text-sm text-muted-foreground">{field.unit}</span>}
          </div>
        );
      case "date":
        return (
          <Input
            id={id}
            name={name}
            type="date"
            className="max-w-48"
            defaultValue={first}
            disabled={disabled}
            required={required}
            data-missing-message="Bir tarih seç."
            aria-describedby={described}
          />
        );
      case "yes_no":
        return (
          <div
            role="radiogroup"
            aria-labelledby={`${id}-label`}
            aria-describedby={described}
            onChange={relayChange}
            className="group/choice grid max-w-60 grid-cols-2 gap-2"
          >
            {(["yes", "no"] as const).map((v, i) => (
              <label key={v} className={chip}>
                <input
                  id={i === 0 ? id : undefined}
                  type="radio"
                  name={name}
                  value={v}
                  defaultChecked={first === v}
                  disabled={disabled}
                  required={required}
                  className="sr-only"
                />
                {v === "yes" ? "Evet" : "Hayır"}
              </label>
            ))}
          </div>
        );
      case "single_choice":
      case "multi_choice": {
        const multi = field.type === "multi_choice";
        return (
          <div
            role={multi ? "group" : "radiogroup"}
            aria-labelledby={`${id}-label`}
            aria-describedby={described}
            onChange={relayChange}
            className="group/choice flex flex-wrap gap-2"
          >
            {field.options.map((o, i) => (
              <label key={o} className={chip}>
                <input
                  id={i === 0 ? id : undefined}
                  type={multi ? "checkbox" : "radio"}
                  name={name}
                  value={o}
                  defaultChecked={defaultValues.includes(o)}
                  disabled={disabled}
                  required={required && (!multi || ticked === 0)}
                  data-missing-message={multi ? "En az birini seç." : undefined}
                  onChange={multi ? (ev) => setTicked((n) => n + (ev.target.checked ? 1 : -1)) : undefined}
                  className="sr-only"
                />
                {o}
              </label>
            ))}
          </div>
        );
      }
    }
  })();

  const grouped = field.type === "yes_no" || field.type === "single_choice" || field.type === "multi_choice";
  return (
    <div className="flex flex-col gap-2">
      {grouped ? (
        <p id={`${id}-label`} className="text-sm font-medium">
          {label}
        </p>
      ) : (
        <Label htmlFor={id}>{label}</Label>
      )}
      {field.helpText && (
        <p id={`${id}-help`} className="-mt-1 text-xs text-muted-foreground">
          {field.helpText}
        </p>
      )}
      {control}
      <FieldError id={id} error={error} />
    </div>
  );
}
