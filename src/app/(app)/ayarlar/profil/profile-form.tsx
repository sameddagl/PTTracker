"use client";

import { useActionState, useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/forms";
import { slugError, toSlug } from "@/lib/slug";
import { submitWithoutReset } from "@/lib/use-form-submit";
import { saveProfileAction, type ProfileField } from "./actions";

export type ProfileValues = {
  slug: string;
  fullName: string;
  businessName: string;
  headline: string;
  bio: string;
  city: string;
  instagram: string;
  phone: string;
  specialties: string;
  publicPageEnabled: boolean;
  iban: string;
  ibanHolder: string;
};

export function ProfileForm({ initial, siteUrl }: { initial: ProfileValues; siteUrl: string }) {
  const [state, action, pending] = useActionState<FormState<ProfileField>, FormData>(saveProfileAction, {});
  const e = state.errors ?? {};
  const [slug, setSlug] = useState(initial.slug || toSlug(initial.businessName || initial.fullName));
  const [enabled, setEnabled] = useState(initial.publicPageEnabled);
  const liveSlugError = slug ? slugError(slug) : null;

  useEffect(() => {
    if (state.savedAt) toast.success("Profil kaydedildi");
  }, [state.savedAt]);

  const host = siteUrl.replace(/^https?:\/\//, "");

  return (
    <form onSubmit={submitWithoutReset(action)} className="flex flex-col gap-5" noValidate>
      <Field id="slug" label="Sayfa adresin" error={e.slug ?? liveSlugError ?? undefined}>
        <div className="flex items-center rounded-lg border focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
          <span className="shrink-0 pl-2.5 text-sm text-muted-foreground">{host}/</span>
          <input
            id="slug"
            name="slug"
            value={slug}
            onChange={(ev) => setSlug(ev.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={30}
            className="h-10 min-w-0 flex-1 bg-transparent pr-2.5 text-base outline-none md:h-8 md:text-sm"
          />
        </div>
      </Field>

      <label className="flex items-start gap-3 rounded-xl border p-4">
        <input
          type="checkbox"
          name="publicPageEnabled"
          checked={enabled}
          onChange={(ev) => setEnabled(ev.target.checked)}
          className="mt-0.5 size-4 accent-[var(--primary)]"
        />
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Sayfam yayında</span>
          <span className="text-xs text-muted-foreground">
            Açıkken linki bilen herkes profilini ve paketlerini görebilir. Instagram bio&apos;na bu linki koy.
          </span>
        </span>
      </label>
      {initial.publicPageEnabled && initial.slug && (
        <a
          href={`/${initial.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="-mt-2 inline-flex items-center gap-1 self-start text-sm text-primary underline-offset-2 hover:underline"
        >
          <ExternalLink className="size-3.5" aria-hidden />
          {host}/{initial.slug}
        </a>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="fullName" label="Adın soyadın" error={e.fullName}>
          <Input id="fullName" name="fullName" defaultValue={initial.fullName} autoComplete="name" />
        </Field>
        <Field id="businessName" label="Stüdyo / marka adı" hint="isteğe bağlı" error={e.businessName}>
          <Input id="businessName" name="businessName" defaultValue={initial.businessName} />
        </Field>
      </div>

      <Field id="headline" label="Kısa tanıtım" hint="tek satır" error={e.headline}>
        <Input
          id="headline"
          name="headline"
          defaultValue={initial.headline}
          placeholder="Örn. Reformer pilates ve postür uzmanı · 8 yıllık deneyim"
          maxLength={120}
        />
      </Field>

      <Field id="bio" label="Hakkımda" error={e.bio}>
        <Textarea
          id="bio"
          name="bio"
          rows={5}
          defaultValue={initial.bio}
          placeholder="Kimlerle çalıştığını, yaklaşımını, sertifikalarını anlat."
          maxLength={1500}
        />
      </Field>

      <Field id="specialties" label="Uzmanlık alanları" hint="virgülle ayır" error={e.specialties}>
        <Input
          id="specialties"
          name="specialties"
          defaultValue={initial.specialties}
          placeholder="Reformer, Hamile pilatesi, Postür, Kuvvet"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field id="city" label="Şehir / semt" error={e.city}>
          <Input id="city" name="city" defaultValue={initial.city} placeholder="Kadıköy, İstanbul" />
        </Field>
        <Field id="instagram" label="Instagram" error={e.instagram}>
          <Input id="instagram" name="instagram" defaultValue={initial.instagram} placeholder="@kullaniciadi" autoCapitalize="none" />
        </Field>
        <Field id="phone" label="WhatsApp numaran" error={e.phone}>
          <Input id="phone" name="phone" type="tel" inputMode="tel" defaultValue={initial.phone} placeholder="0532 123 45 67" />
        </Field>
      </div>

      <fieldset className="flex flex-col gap-4 rounded-xl border p-4">
        <legend className="px-1 text-sm font-medium">Ödeme bilgileri</legend>
        <p className="-mt-1 text-xs text-muted-foreground">
          Onayladığın danışanlar kendi sayfalarında bu hesabı ve açıklamaya yazacakları ödeme kodunu görür. Para doğrudan senin
          hesabına gelir.
        </p>
        <Field id="iban" label="IBAN" error={e.iban}>
          <Input
            id="iban"
            name="iban"
            defaultValue={initial.iban}
            placeholder="TR00 0000 0000 0000 0000 0000 00"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            className="tabular-nums"
          />
        </Field>
        <Field id="ibanHolder" label="Hesap sahibi" error={e.ibanHolder}>
          <Input id="ibanHolder" name="ibanHolder" defaultValue={initial.ibanHolder} autoComplete="off" />
        </Field>
      </fieldset>

      <Button type="submit" size="lg" disabled={pending || !!liveSlugError} className="sm:self-start">
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </Button>
    </form>
  );
}
