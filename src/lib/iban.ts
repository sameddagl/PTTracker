// Turkish IBANs: "TR" + 2 check digits + 22 digits (26 characters).

export const normalizeIban = (raw: string) => raw.replace(/\s+/g, "").toUpperCase();

/** ISO 13616 mod-97 check; catches typos, not just the wrong length. */
export function isValidIban(raw: string) {
  const iban = normalizeIban(raw);
  if (!/^TR\d{24}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const digits = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let remainder = 0;
  for (const d of digits) remainder = (remainder * 10 + Number(d)) % 97;
  return remainder === 1;
}

/** "TR330006100519786457841326" → "TR33 0006 1005 1978 6457 8413 26" */
export const formatIban = (raw: string) => normalizeIban(raw).replace(/(.{4})/g, "$1 ").trim();

/**
 * Short reference the client writes in the transfer description so the
 * trainer can match it: initials + a piece of the package id, e.g. "ED-3F9A".
 */
export function paymentCode(clientName: string, clientPackageId: string) {
  const initials = clientName
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr"))
    .join("")
    .slice(0, 3);
  return `${initials}-${clientPackageId.replace(/-/g, "").slice(0, 4).toUpperCase()}`;
}
