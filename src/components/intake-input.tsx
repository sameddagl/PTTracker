"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { answerName, type IntakeFieldDef } from "@/lib/intake";

const chip =
  "flex min-h-11 cursor-pointer items-center justify-center rounded-full border px-4 py-2 text-sm transition-colors has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring";

/** One trainer-defined question, rendered for its type. */
export function IntakeInput({
  field,
  error,
  defaultValues = [],
  disabled,
}: {
  field: IntakeFieldDef & { id: string };
  error?: string;
  /** Current answer as form values (see answerToRaw), when editing. */
  defaultValues?: string[];
  disabled?: boolean;
}) {
  const name = answerName(field.id);
  const first = defaultValues[0] ?? "";
  const id = `f-${field.id}`;
  const described = [field.helpText ? `${id}-help` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  const label = (
    <>
      {field.label}
      {field.required ? <span className="text-destructive-strong"> *</span> : <span className="font-normal text-muted-foreground"> · isteğe bağlı</span>}
    </>
  );

  const control = (() => {
    switch (field.type) {
      case "short_text":
        return <Input id={id} name={name} maxLength={200} defaultValue={first} disabled={disabled} aria-invalid={!!error || undefined} aria-describedby={described} />;
      case "long_text":
        return <Textarea id={id} name={name} rows={3} maxLength={2000} defaultValue={first} disabled={disabled} aria-invalid={!!error || undefined} aria-describedby={described} />;
      case "number":
        return (
          <div className="flex items-center gap-2">
            <Input
              id={id}
              name={name}
              inputMode="decimal"
              className="max-w-32"
              defaultValue={first}
              disabled={disabled}
              aria-invalid={!!error || undefined}
              aria-describedby={described}
            />
            {field.unit && <span className="text-sm text-muted-foreground">{field.unit}</span>}
          </div>
        );
      case "date":
        return <Input id={id} name={name} type="date" className="max-w-48" defaultValue={first} disabled={disabled} aria-invalid={!!error || undefined} aria-describedby={described} />;
      case "yes_no":
        return (
          <div role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={described} className="grid max-w-60 grid-cols-2 gap-2">
            {(["yes", "no"] as const).map((v) => (
              <label key={v} className={chip}>
                <input type="radio" name={name} value={v} defaultChecked={first === v} disabled={disabled} className="sr-only" />
                {v === "yes" ? "Evet" : "Hayır"}
              </label>
            ))}
          </div>
        );
      case "single_choice":
      case "multi_choice":
        return (
          <div
            role={field.type === "single_choice" ? "radiogroup" : "group"}
            aria-labelledby={`${id}-label`}
            aria-describedby={described}
            className="flex flex-wrap gap-2"
          >
            {field.options.map((o) => (
              <label key={o} className={chip}>
                <input
                  type={field.type === "single_choice" ? "radio" : "checkbox"}
                  name={name}
                  value={o}
                  defaultChecked={defaultValues.includes(o)}
                  disabled={disabled}
                  className="sr-only"
                />
                {o}
              </label>
            ))}
          </div>
        );
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
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive-strong">
          {error}
        </p>
      )}
    </div>
  );
}
