"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { Field, FormError } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { approveApplicationAction, type DecisionState } from "../actions";

export function ApproveForm({ id, today }: { id: string; today: string }) {
  const [state, action, pending] = useActionState<DecisionState, FormData>(approveApplicationAction, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <FormError message={state.error} />
      <Field id="startsOn" label="Paket başlangıcı" hint="son kullanım tarihi buna göre hesaplanır">
        <Input id="startsOn" name="startsOn" type="date" defaultValue={today} className="max-w-48" />
      </Field>
      <Button type="submit" size="lg" disabled={pending} className="sm:self-start">
        <Check />
        {pending ? "Onaylanıyor…" : "Onayla"}
      </Button>
    </form>
  );
}
