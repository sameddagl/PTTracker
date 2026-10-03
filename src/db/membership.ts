// Which account a signed-in person works in. Pure, so tests can use it.

/** The signed-in person inside the account a request works in. */
export type Member = { id: string; userId: string; accountId: string; role: "owner" | "instructor"; name: string };

export type Membership = Member & { onboarded: boolean };

/**
 * The account a user works in: the one they picked if they still belong to it,
 * else their own account once it is set up, else the first account they joined.
 */
export function pickMembership(list: Membership[], userId: string, chosen: string | undefined) {
  return (
    list.find((m) => m.accountId === chosen) ??
    list.find((m) => m.accountId === userId && m.onboarded) ??
    list.find((m) => m.onboarded) ??
    list.find((m) => m.accountId === userId) ??
    null
  );
}
