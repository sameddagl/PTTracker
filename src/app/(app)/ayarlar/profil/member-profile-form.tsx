"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Field } from "@/components/field";
import { FormSubmit } from "@/components/form-submit";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/forms";
import { saveMemberProfileAction } from "./actions";

/** An instructor's name and short intro, shown to clients and on the studio's page. */
export function MemberProfileForm({ fullName, bio }: { fullName: string; bio: string | null }) {
  const [state, action, pending] = useActionState<FormState<"fullName" | "bio">, FormData>(saveMemberProfileAction, {});
  useEffect(() => {
    if (state.savedAt) toast.success("Profilin kaydedildi");
  }, [state.savedAt]);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Field id="fullName" label="Ad soyad" error={state.errors?.fullName}>
        <Input id="fullName" name="fullName" defaultValue={state.values?.fullName ?? fullName} required minLength={2} autoComplete="name" />
      </Field>
      <Field id="bio" label="Kısa tanıtım" hint="isteğe bağlı" error={state.errors?.bio}>
        <Textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={300}
          defaultValue={state.values?.bio ?? bio ?? ""}
          placeholder="Reformer ve klinik pilates. Duruş bozuklukları ve bel ağrısıyla çalışıyorum."
        />
      </Field>
      <FormSubmit loading={pending} className="sm:self-start">
        Kaydet
      </FormSubmit>
    </form>
  );
}
