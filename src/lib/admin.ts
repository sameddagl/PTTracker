import "server-only";

/** Owner accounts that may open /yonetim, from ADMIN_EMAILS (comma separated). */
export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

/** Where notices for the team go: ADMIN_EMAILS, or the public contact address when that's unset. */
export function adminEmails() {
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  return list.length > 0 ? list : [process.env.CONTACT_EMAIL ?? "info@studyomapp.com"];
}
