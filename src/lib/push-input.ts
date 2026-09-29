import { z } from "zod";

/** A PushSubscription as the browser serialises it. */
export const subscriptionSchema = z.object({
  endpoint: z.url().refine((u) => u.startsWith("https://"), "https gerekli").max(2000),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(5).max(100) }),
});
