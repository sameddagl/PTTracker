import "server-only";
import { APP_NAME, siteUrl } from "./config";
import { layout, sendMail } from "./mail";
import { INVITE_DAYS } from "./team";

/** The invitation e-mail. Sent directly: it is the only way the instructor gets the link. */
export async function sendInviteMail(input: { to: string; name: string; studio: string; token: string }) {
  const url = `${siteUrl()}/davet/${input.token}`;
  const { html, text } = layout({
    heading: `${input.studio} seni ekibine ekledi`,
    lines: [
      `Merhaba ${input.name.split(" ")[0]}, ${input.studio} seni ${APP_NAME}'da eğitmen olarak ekledi.`,
      "Derslerini, yoklamayı ve danışanlarının notlarını buradan takip edeceksin. Katılmak için bu e-posta adresinle giriş yapman yeterli.",
      `Link ${INVITE_DAYS} gün geçerli.`,
    ],
    cta: { label: "Ekibe katıl", url },
  });
  return sendMail({ to: input.to, subject: `${input.studio} seni ${APP_NAME}'da ekibine ekledi`, html, text });
}
