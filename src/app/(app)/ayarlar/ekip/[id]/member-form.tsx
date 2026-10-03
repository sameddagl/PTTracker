"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserMinus } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog";
import { Field, FormError, NativeSelect } from "@/components/field";
import { FormSubmit } from "@/components/form-submit";
import { Switch } from "@/components/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PayRule } from "@/db/schema";
import type { FormState } from "@/lib/forms";
import { SESSION_LABELS } from "@/lib/payroll";
import { PERMISSIONS, type Permission, type Permissions } from "@/lib/permissions";
import { TEAM_COLORS, TEAM_COLOR_LABELS, teamColor } from "@/lib/team";
import { cn } from "@/lib/utils";
import { inviteMemberAction, saveMemberAction, setMemberActiveAction, setMemberPermissionAction } from "../actions";

type F = "payType" | "color" | "private" | "duet" | "trio" | "group" | "percent" | "form";
const TYPES = ["private", "duet", "trio", "group"] as const;

const amountText = (n: number | undefined) => (n ? String(n).replace(".", ",") : "");

export function MemberForm({ id, color, payRule, isOwner }: { id: string; color: string; payRule: PayRule | null; isOwner: boolean }) {
  const [state, action, pending] = useActionState<FormState<F>, FormData>(saveMemberAction.bind(null, id), {});
  const [payType, setPayType] = useState<"none" | "per_lesson" | "percent">(payRule?.type ?? "none");
  const [c, setC] = useState(color);
  const v = state.values;

  useEffect(() => {
    if (state.savedAt) toast.success("Kaydedildi");
  }, [state.savedAt]);

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <FormError message={state.errors?.form} />
      <Field id="color" label="Takvimdeki rengi" error={state.errors?.color}>
        <div className="flex items-center gap-3">
          <span className="size-5 shrink-0 rounded-full" style={{ background: teamColor(c) }} aria-hidden />
          <NativeSelect id="color" name="color" value={c} onChange={(e) => setC(e.target.value)} className="max-w-56">
            {TEAM_COLORS.map((k) => (
              <option key={k} value={k}>
                {TEAM_COLOR_LABELS[k]}
              </option>
            ))}
          </NativeSelect>
        </div>
      </Field>

      {isOwner ? (
        <input type="hidden" name="payType" value="none" />
      ) : (
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-2 text-sm font-medium">Hakediş</legend>
          <div role="radiogroup" aria-label="Hakediş türü" className="grid gap-2 sm:grid-cols-3">
            {(
              [
                ["none", "Yok", "Hakediş hesaplanmaz"],
                ["per_lesson", "Ders başı", "Ders türüne göre sabit tutar"],
                ["percent", "Yüzde", "Dersin değerinin yüzdesi"],
              ] as const
            ).map(([value, title, hint]) => (
              <label
                key={value}
                className={cn(
                  "flex min-h-11 cursor-pointer flex-col rounded-2xl border px-4 py-3 text-sm transition-colors",
                  payType === value ? "border-foreground bg-muted/60" : "hover:bg-muted/40",
                )}
              >
                <input type="radio" name="payType" value={value} checked={payType === value} onChange={() => setPayType(value)} className="sr-only" />
                <span className="font-medium">{title}</span>
                <span className="text-xs text-muted-foreground">{hint}</span>
              </label>
            ))}
          </div>

          {payType === "per_lesson" && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TYPES.map((t) => (
                <Field key={t} id={t} label={`${SESSION_LABELS[t]} ders`} error={state.errors?.[t]}>
                  <Input
                    id={t}
                    name={t}
                    inputMode="decimal"
                    placeholder="0"
                    defaultValue={v?.[t] ?? (payRule?.type === "per_lesson" ? amountText(payRule[t]) : "")}
                  />
                </Field>
              ))}
              <p className="col-span-full text-xs text-muted-foreground">Danışanın geldiği her ders için ödenen tutar (TL). Boş bırakılan tür 0 sayılır.</p>
            </div>
          )}

          {payType === "percent" && (
            <Field id="percent" label="Oran (%)" error={state.errors?.percent}>
              <Input
                id="percent"
                name="percent"
                inputMode="numeric"
                className="max-w-32"
                defaultValue={v?.percent ?? (payRule?.type === "percent" ? String(payRule.percent) : "")}
              />
              <span className="text-xs text-muted-foreground">
                Dersin değeri: gelen her danışanın paket fiyatı ÷ paketteki ders sayısı. Örn. 12 derslik 6.000 TL&apos;lik paketle gelen danışanın bir dersi 500 TL; %40 ise
                eğitmene 200 TL.
              </span>
            </Field>
          )}
        </fieldset>
      )}

      <FormSubmit loading={pending} className="sm:self-start">
        Kaydet
      </FormSubmit>
    </form>
  );
}

export function RemoveMemberButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  const { confirm, dialog } = useConfirm();
  const router = useRouter();
  return (
    <>
      {dialog}
      <Button
        type="button"
        variant="ghost"
        className="self-start text-destructive-strong hover:text-destructive-strong"
        loading={pending}
        onClick={async () => {
          const ok = await confirm({
            title: `${name} ekipten çıkarılsın mı?`,
            body: "Uygulamaya erişimi kapanır. Geçmiş dersleri ve notları stüdyoda kalır; gelecekteki derslerini takvimden başka bir eğitmene aktarabilirsin.",
            confirmLabel: "Ekipten çıkar",
            destructive: true,
          });
          if (!ok) return;
          start(async () => {
            const res = await setMemberActiveAction(id, false);
            if (!res.ok) return void toast.error(res.error);
            toast.success(`${name} ekipten çıkarıldı`);
            router.push("/ayarlar/ekip");
          });
        }}
      >
        <UserMinus />
        Ekipten çıkar
      </Button>
    </>
  );
}

/** Owner: send a login invitation to an instructor who was added without one. */
export function InviteMemberForm({ id, pendingEmail }: { id: string; pendingEmail: string | null }) {
  const [state, action, pending] = useActionState(inviteMemberAction.bind(null, id), {});
  useEffect(() => {
    if (state.sentAt) toast.success("Giriş daveti gönderildi");
  }, [state.sentAt]);
  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <FormError message={state.error} />
      {pendingEmail && (
        <p className="text-sm text-muted-foreground">
          <strong className="font-medium text-foreground">{pendingEmail}</strong> adresine gönderilmiş bir davet bekliyor. Ekip sayfasından yeniden gönderebilir ya da
          iptal edebilirsin.
        </p>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <Field id="invite-email" label="E-posta" className="min-w-56 flex-1">
          <Input id="invite-email" name="email" type="email" inputMode="email" autoComplete="off" required />
        </Field>
        <FormSubmit loading={pending} variant="outline">
          Davet gönder
        </FormSubmit>
      </div>
    </form>
  );
}

/** Owner: what this instructor may do, one switch per permission; saved on each change. */
export function PermissionSwitches({ id, permissions }: { id: string; permissions: Permissions }) {
  const [state, setState] = useState(() => Object.fromEntries(PERMISSIONS.map((p) => [p.key, permissions[p.key] ?? p.default])) as Record<Permission, boolean>);
  const [pending, start] = useTransition();
  return (
    <div className="divide-y">
      {PERMISSIONS.map((p) => (
        <div key={p.key} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{p.title}</p>
            <p className="text-xs text-muted-foreground">{p.hint}</p>
          </div>
          <Switch
            on={state[p.key]}
            label={p.title}
            disabled={pending}
            onChange={(on) => {
              setState((s) => ({ ...s, [p.key]: on }));
              start(async () => {
                const res = await setMemberPermissionAction(id, p.key, on);
                if (!res.ok) {
                  setState((s) => ({ ...s, [p.key]: !on }));
                  toast.error(res.error);
                }
              });
            }}
          />
        </div>
      ))}
    </div>
  );
}
