"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNext, siteUrl } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export type LoginState =
  | { step: "email"; error?: string; email?: string }
  // sentAt drives the resend countdown on the client.
  | { step: "code"; email: string; sentAt: number; error?: string; resent?: boolean };

const emailSchema = z.email({ error: "Geçerli bir e-posta adresi gir." });
// Supabase's OTP length is configurable (6–10 digits); accept any of them.
const codeSchema = z.string().regex(/^\d{6,10}$/, { error: "Kod 6 haneli olmalı." });

async function sendCode(email: string, next: string) {
  const supabase = await createClient();
  // The same email carries the code and, as a fallback, a sign-in link.
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) {
    console.error("[auth] signInWithOtp failed", { status: error.status, code: error.code, message: error.message });
    return error.status === 429
      ? "Çok fazla deneme. Birkaç dakika sonra tekrar dene."
      : "Kod gönderilemedi. Biraz sonra tekrar dene.";
  }
  return null;
}

export async function loginAction(prev: LoginState, formData: FormData): Promise<LoginState> {
  const intent = formData.get("intent")?.toString();
  const next = safeNext(formData.get("next")?.toString());

  if (intent === "change-email") return { step: "email", email: prev.email };

  if (intent === "resend" && prev.step === "code") {
    const error = await sendCode(prev.email, next);
    return error
      ? { ...prev, error, resent: false }
      : { step: "code", email: prev.email, sentAt: Date.now(), resent: true };
  }

  if (prev.step === "code") {
    const code = codeSchema.safeParse(String(formData.get("code") ?? "").replace(/\s/g, ""));
    if (!code.success) return { ...prev, error: code.error.issues[0].message, resent: false };

    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ email: prev.email, token: code.data, type: "email" });
    if (error) {
      console.error("[auth] verifyOtp failed", { status: error.status, code: error.code });
      return {
        ...prev,
        resent: false,
        error:
          error.code === "otp_expired"
            ? "Kodun süresi dolmuş ya da kod hatalı. Yeni kod iste."
            : "Kod doğrulanamadı. Tekrar dene.",
      };
    }
    redirect(next);
  }

  const email = emailSchema.safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { step: "email", error: email.error.issues[0].message };

  const error = await sendCode(email.data, next);
  return error ? { step: "email", email: email.data, error } : { step: "code", email: email.data, sentAt: Date.now() };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/giris");
}
