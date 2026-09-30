"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { FormSubmit } from "@/components/form-submit";

/** Submit button for plain `<form action>` forms: spins while the action runs, disabled while the form is incomplete. */
export function SubmitButton(props: Omit<ComponentProps<typeof FormSubmit>, "loading">) {
  const { pending } = useFormStatus();
  return <FormSubmit loading={pending} {...props} />;
}
