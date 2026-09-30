"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { Field, FormError } from "@/components/field";
import { FormSubmit } from "@/components/form-submit";
import { Input } from "@/components/ui/input";
import { approveApplicationAction, type DecisionState } from "../actions";

export function ApproveForm({ id, today }: { id: string; today: string }) {
  const [state, action, pending] = useActionState<DecisionState, FormData>(approveApplicationAction, {});
  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="id" value={id} />
      <FormError message={state.error} />
      <Field id="startsOn" label="Paket başlangıcı" hint="paketin son tarihi buna göre belirlenir">
        <Input id="startsOn" name="startsOn" type="date" required defaultValue={today} className="max-w-48" />
      </Field>
      <FormSubmit size="lg" loading={pending} className="sm:self-start">
        <Check />
        {pending ? "Onaylanıyor…" : "Onayla"}
      </FormSubmit>
    </form>
  );
}
