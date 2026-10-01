import "server-only";
import { APP_NAME, siteUrl } from "./config";
import { LEGAL } from "./legal";
import { layout, sendMail } from "./mail";

/** Where contact-form notices go: SUPPORT_EMAIL (comma separated), or the public address when unset. */
export function supportInbox() {
  const list = (process.env.SUPPORT_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  return list.length > 0 ? list : [LEGAL.email];
}

/**
 * Tells the team a contact-form message arrived, with a link to answer it in
 * /yonetim. Only for people without an account: trainers' messages stay in the
 * inbox and are not e-mailed.
 */
export async function mailTeamAboutContact(input: { threadId: string; from: string; contact: string | null; body: string }) {
  const url = `${siteUrl()}/yonetim/mesajlar/${input.threadId}`;
  const { html, text } = layout({
    heading: "İletişim formundan mesaj",
    lines: [`${input.from}${input.contact ? ` · ${input.contact}` : ""}`, input.body],
    cta: { label: "Cevapla", url },
  });
  for (const to of supportInbox()) await sendMail({ to, subject: `${APP_NAME} · İletişim formu: ${input.from}`, html, text });
}
