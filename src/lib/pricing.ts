// Package pricing: a cash price, an optional installment option with its own
// total, and an optional struck-through "was" price for showing a discount.

type Money = string | number | null;

export type PricedTemplate = {
  price: Money;
  compareAtPrice: Money;
  installmentPrice: Money;
  installments: number;
};

export type PaymentOption = {
  /** 1 = paid at once. */
  installments: number;
  total: number;
};

const num = (v: Money) => (v === null || v === "" ? null : Number(v));

/** Whole-percent discount of `price` against `compareAt`, or null when there is none. */
export function discountPercent(compareAt: Money, price: Money) {
  const was = num(compareAt);
  const now = num(price);
  if (was === null || now === null || was <= now || was <= 0) return null;
  const pct = Math.round(((was - now) / was) * 100);
  return pct > 0 ? pct : null;
}

/** The ways a template can be paid for: cash (when priced) and the installment plan. */
export function paymentOptions(t: PricedTemplate): PaymentOption[] {
  const options: PaymentOption[] = [];
  const cash = num(t.price);
  if (cash !== null) options.push({ installments: 1, total: cash });
  const inst = num(t.installmentPrice);
  if (inst !== null && t.installments > 1) options.push({ installments: t.installments, total: inst });
  return options;
}

/** The option matching the applicant's pick, falling back to the first one. */
export function pickOption(t: PricedTemplate, installments: number): PaymentOption | null {
  const options = paymentOptions(t);
  return options.find((o) => o.installments === installments) ?? options[0] ?? null;
}

/** Monthly amount of an installment option, rounded like the plan's later installments. */
export const monthlyAmount = (o: PaymentOption) => Math.floor(o.total / o.installments);

/** "Peşin" or "3 taksit" — how an option is paid. */
export const optionLabel = (o: PaymentOption) => (o.installments > 1 ? `${o.installments} taksit` : "Peşin");

/** The option an application was made with, from its template's prices and the picked count. */
export const applicationOption = (a: {
  price: Money;
  compareAtPrice: Money;
  installmentPrice: Money;
  templateInstallments: number;
  installments: number;
}) => pickOption({ ...a, installments: a.templateInstallments }, a.installments);
