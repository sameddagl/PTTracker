// Turkish messages for the browser's built-in form checks (required,
// type="email", minLength, min/max, pattern…). An input can override the
// text with data-invalid-message, e.g. to explain a pattern.

type Checkable = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export function isCheckable(el: Element | null): el is Checkable {
  return el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement;
}

export function validityMessage(el: Checkable): string | null {
  const v = el.validity;
  if (v.valid) return null;
  const custom = el.dataset.invalidMessage;
  if (v.customError) return el.validationMessage;
  if (v.valueMissing) {
    if (custom) return custom;
    const choice = el instanceof HTMLSelectElement || (el instanceof HTMLInputElement && (el.type === "radio" || el.type === "checkbox"));
    return choice ? "Birini seç." : "Bu alanı doldur.";
  }
  if (custom) return custom;
  if (el instanceof HTMLInputElement) {
    if (v.typeMismatch) return el.type === "email" ? "Geçerli bir e-posta adresi yaz." : "Adresi kontrol et.";
    if (v.badInput) return el.type === "number" ? "Sayı yaz." : "Değeri kontrol et.";
    if (v.rangeUnderflow) return `En az ${el.min} olmalı.`;
    if (v.rangeOverflow) return `En fazla ${el.max} olabilir.`;
    if (v.stepMismatch) return "Tam sayı yaz.";
  }
  if (v.tooShort) return `En az ${(el as HTMLInputElement).minLength} karakter yaz.`;
  if (v.tooLong) return `En fazla ${(el as HTMLInputElement).maxLength} karakter olabilir.`;
  if (v.patternMismatch) return el.title || "Biçimi kontrol et.";
  return "Bu alanı kontrol et.";
}
