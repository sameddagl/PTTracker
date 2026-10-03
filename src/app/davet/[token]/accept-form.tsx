"use client";

import { useActionState } from "react";
import { FormError } from "@/components/field";
import { FormSubmit } from "@/components/form-submit";
import { acceptInviteAction } from "./actions";

export function AcceptForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acceptInviteAction.bind(null, token), {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <FormError message={state.error} />
      <FormSubmit loading={pending} size="lg">
        Ekibe katıl
      </FormSubmit>
    </form>
  );
}
