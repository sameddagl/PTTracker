"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { RotateCcw, Send, X } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog";
import { Field, FormError, NativeSelect } from "@/components/field";
import { FormSubmit } from "@/components/form-submit";
import { Switch } from "@/components/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/forms";
import { TEAM_COLORS, TEAM_COLOR_LABELS, teamColor } from "@/lib/team";
import { inviteAction, resendInviteAction, revokeInviteAction, saveTeamSettingAction, setMemberActiveAction } from "./actions";

type InviteField = "fullName" | "email" | "color" | "form";

export function InviteForm({ suggestedColor }: { suggestedColor: string }) {
  const [state, action, pending] = useActionState<FormState<InviteField>, FormData>(inviteAction, {});
  const form = useRef<HTMLFormElement>(null);
  // The suggestion follows the team (next free colour) until the owner picks one.
  const [picked, setPicked] = useState<string | null>(null);
  const color = picked ?? suggestedColor;

  useEffect(() => {
    if (!state.savedAt) return;
    toast.success("Davet gönderildi", { description: "Eğitmen e-postadaki linkle katılır." });
    form.current?.reset();
  }, [state.savedAt]);

  return (
    <form ref={form} action={action} onReset={() => setPicked(null)} className="flex flex-col gap-4" noValidate>
      <FormError message={state.errors?.form} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="fullName" label="Ad soyad" error={state.errors?.fullName}>
          <Input id="fullName" name="fullName" defaultValue={state.values?.fullName} autoComplete="off" required minLength={2} />
        </Field>
        <Field id="email" label="E-posta" error={state.errors?.email}>
          <Input id="email" name="email" type="email" inputMode="email" defaultValue={state.values?.email} autoComplete="off" required />
        </Field>
      </div>
      <Field id="color" label="Takvimdeki rengi" error={state.errors?.color}>
        <div className="flex items-center gap-3">
          <span className="size-5 shrink-0 rounded-full" style={{ background: teamColor(color) }} aria-hidden />
          <NativeSelect id="color" name="color" value={color} onChange={(e) => setPicked(e.target.value)} className="max-w-56">
            {TEAM_COLORS.map((c) => (
              <option key={c} value={c}>
                {TEAM_COLOR_LABELS[c]}
              </option>
            ))}
          </NativeSelect>
        </div>
      </Field>
      <FormSubmit loading={pending} className="sm:self-start">
        <Send />
        Davet gönder
      </FormSubmit>
    </form>
  );
}

export function InviteActions({ id, email }: { id: string; email: string }) {
  const [pending, start] = useTransition();
  const [which, setWhich] = useState<"resend" | "revoke" | null>(null);
  const { confirm, dialog } = useConfirm();
  return (
    <div className="flex shrink-0 gap-1">
      {dialog}
      <Button
        type="button"
        size="sm"
        variant="outline"
        loading={pending && which === "resend"}
        disabled={pending}
        onClick={() => {
          setWhich("resend");
          start(async () => {
            const res = await resendInviteAction(id);
            if (res.ok) toast.success("Davet yeniden gönderildi", { description: email });
            else toast.error(res.error);
          });
        }}
      >
        <RotateCcw />
        Yeniden gönder
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label="Daveti iptal et"
        loading={pending && which === "revoke"}
        disabled={pending}
        onClick={async () => {
          if (!(await confirm({ title: "Davet iptal edilsin mi?", body: "E-postadaki link çalışmaz.", confirmLabel: "İptal et", destructive: true }))) return;
          setWhich("revoke");
          start(async () => {
            const res = await revokeInviteAction(id);
            if (!res.ok) toast.error(res.error);
          });
        }}
      >
        <X />
      </Button>
    </div>
  );
}

export function ReactivateButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      loading={pending}
      onClick={() =>
        start(async () => {
          const res = await setMemberActiveAction(id, true);
          if (res.ok) toast.success("Eğitmen ekibe geri eklendi");
          else toast.error(res.error);
        })
      }
    >
      Geri al
    </Button>
  );
}

/** One studio-wide on/off setting with its explanation. */
export function TeamSetting({ name, initial, title, hint }: { name: "instructorsSeeAllClients" | "payrollCountsMissed"; initial: boolean; title: string; hint: string }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch
        on={on}
        label={title}
        disabled={pending}
        onChange={(v) => {
          setOn(v);
          start(async () => {
            const res = await saveTeamSettingAction(name, v);
            if (!res.ok) {
              setOn(!v);
              toast.error(res.error);
            }
          });
        }}
      />
    </div>
  );
}
