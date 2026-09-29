import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { APP_NAME } from "./config";

// Transactional email over SMTP (Gmail app password during the beta, a
// proper provider with our own domain later). Without SMTP settings, emails
// are logged instead of sent, so local development needs no mail setup.

let transporter: Transporter | null | undefined;

function getTransporter() {
  if (transporter !== undefined) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  transporter =
    SMTP_HOST && SMTP_USER && SMTP_PASS
      ? nodemailer.createTransport({
          host: SMTP_HOST,
          port: Number(SMTP_PORT ?? 465),
          secure: Number(SMTP_PORT ?? 465) === 465,
          auth: { user: SMTP_USER, pass: SMTP_PASS },
        })
      : null;
  return transporter;
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** A plain, mobile-friendly email with one call-to-action button. */
export function layout({ heading, lines, cta, footer }: { heading: string; lines: string[]; cta?: { label: string; url: string }; footer?: string }) {
  const html = `<!doctype html><html lang="tr"><body style="margin:0;background:#f5f5f4;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1c1917">
<div style="max-width:480px;margin:0 auto;padding:32px 20px">
<div style="background:#fff;border-radius:16px;padding:28px 24px">
<h1 style="margin:0 0 16px;font-size:20px">${escape(heading)}</h1>
${lines.map((l) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.5">${escape(l)}</p>`).join("")}
${cta ? `<p style="margin:24px 0 8px"><a href="${escape(cta.url)}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">${escape(cta.label)}</a></p><p style="margin:0;font-size:12px;color:#78716c;word-break:break-all">${escape(cta.url)}</p>` : ""}
</div>
<p style="margin:16px 0 0;font-size:12px;color:#78716c;text-align:center">${escape(footer ?? APP_NAME)}</p>
</div></body></html>`;
  const text = [heading, "", ...lines, ...(cta ? ["", `${cta.label}: ${cta.url}`] : [])].join("\n");
  return { html, text };
}

export async function sendMail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }) {
  const t = getTransporter();
  if (!t) {
    console.info(`[mail] SMTP not configured; would send "${subject}" to ${to}`);
    return false;
  }
  try {
    await t.sendMail({ from: process.env.MAIL_FROM ?? process.env.SMTP_USER, to, subject, html, text });
    return true;
  } catch (e) {
    // A failed email must never fail the sign-up or approval itself.
    console.error("[mail] send failed", e);
    return false;
  }
}
