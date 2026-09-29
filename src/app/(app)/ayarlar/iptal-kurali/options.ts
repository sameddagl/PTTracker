/** Hours before a lesson until which a cancellation is free. 0 = cancelling is always free. */
export const LATE_CANCEL_OPTIONS = [0, 2, 3, 4, 6, 8, 12, 24, 36, 48] as const;

export const lateCancelLabel = (h: number) => (h === 0 ? "Kural yok, iptal her zaman ücretsiz" : `${h} saat`);
