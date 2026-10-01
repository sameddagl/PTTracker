import "server-only";
import { adminEmails } from "./admin";
import { APP_NAME, siteUrl } from "./config";
import { layout, sendMail } from "./mail";

/** Tells the team a message arrived, with a link to answer it in /yonetim. */
export async function mailTeamAboutSupport(input: { threadId: string; from: string; contact: string | null; body: string; source: "landing" | "app" }) {
  const url = `${siteUrl()}/yonetim/mesajlar/${input.threadId}`;
  const subject = `${APP_NAME} · ${input.source === "landing" ? "İletişim formu" : "Eğitmen mesajı"}: ${input.from}`;
  const { html, text } = layout({
    heading: input.source === "landing" ? "İletişim formundan mesaj" : "Uygulamadan eğitmen mesajı",
    lines: [`${input.from}${input.contact ? ` · ${input.contact}` : ""}`, input.body],
    cta: { label: "Cevapla", url },
  });
  for (const to of adminEmails()) await sendMail({ to, subject, html, text });
}
