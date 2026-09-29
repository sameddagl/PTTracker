"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { saveProfile, type ProfileFormState } from "./actions";

const DISCIPLINES = [
  { value: "pt", label: "Personal trainer" },
  { value: "pilates", label: "Pilates" },
  { value: "both", label: "İkisi de" },
] as const;

export function ProfileForm({ defaultName }: { defaultName: string }) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(saveProfile, {});
  const v = state.values ?? { fullName: defaultName };
  const e = state.errors ?? {};

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">Adın soyadın</Label>
        <Input id="fullName" name="fullName" autoComplete="name" defaultValue={v.fullName} required autoFocus />
        {e.fullName && <p className="text-sm text-destructive">{e.fullName}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="businessName">
          Stüdyo / işletme adı <span className="font-normal text-muted-foreground">· isteğe bağlı</span>
        </Label>
        <Input id="businessName" name="businessName" defaultValue={v.businessName} />
        <p className="text-xs text-muted-foreground">Danışanların kendi sayfalarında bu adı görür.</p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Branşın</legend>
        <div className="grid grid-cols-3 gap-2">
          {DISCIPLINES.map((d) => (
            <label
              key={d.value}
              className={cn(
                "flex cursor-pointer items-center justify-center rounded-lg border px-2 py-3 text-center text-sm font-medium transition-colors",
                "has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
              )}
            >
              <input
                type="radio"
                name="discipline"
                value={d.value}
                defaultChecked={(v.discipline ?? "both") === d.value}
                className="sr-only"
              />
              {d.label}
            </label>
          ))}
        </div>
        {e.discipline && <p className="text-sm text-destructive">{e.discipline}</p>}
      </fieldset>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Kaydediliyor…" : "Başla"}
      </Button>
    </form>
  );
}
