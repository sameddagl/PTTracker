import "server-only";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import type { Tx } from "./index";
import { portalTokens } from "./schema";

// Client portal links: /p/<token>. The token is derived from the link's id
// with a server secret, so the trainer can copy the same link again at any
// time, while the database only holds a hash of it: a leaked database (without
// the secret) yields no working links. Revoking a row kills its link.

const TOKEN_LENGTH = 32;
export const PORTAL_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32}$/;

function secret() {
  const s = process.env.PORTAL_SECRET;
  if (!s || s.length < 32) throw new Error("PORTAL_SECRET is missing or too short (see .env.example)");
  return s;
}

export const tokenFor = (linkId: string, key = secret()) =>
  createHmac("sha256", key).update(`portal:${linkId}`).digest("base64url").slice(0, TOKEN_LENGTH);

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export type PortalLink = { id: string; token: string; createdAt: Date; lastUsedAt: Date | null };

export async function getActivePortalLink(tx: Tx, clientId: string): Promise<PortalLink | null> {
  const [row] = await tx
    .select({ id: portalTokens.id, createdAt: portalTokens.createdAt, lastUsedAt: portalTokens.lastUsedAt })
    .from(portalTokens)
    .where(and(eq(portalTokens.clientId, clientId), isNull(portalTokens.revokedAt)))
    .orderBy(desc(portalTokens.createdAt))
    .limit(1);
  return row ? { ...row, token: tokenFor(row.id) } : null;
}

/** Active link tokens for several clients at once (clientId → token). */
export async function getActivePortalTokens(tx: Tx, clientIds: string[]) {
  if (clientIds.length === 0) return new Map<string, string>();
  const rows = await tx
    .select({ id: portalTokens.id, clientId: portalTokens.clientId })
    .from(portalTokens)
    .where(and(inArray(portalTokens.clientId, clientIds), isNull(portalTokens.revokedAt)));
  return new Map(rows.map((r) => [r.clientId, tokenFor(r.id)]));
}

/** Revokes the client's current link, if any. */
export async function revokePortalLinks(tx: Tx, clientId: string) {
  await tx
    .update(portalTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(portalTokens.clientId, clientId), isNull(portalTokens.revokedAt)));
}

/** A fresh link for the client; any earlier link stops working. */
export async function createPortalLink(tx: Tx, trainerId: string, clientId: string): Promise<PortalLink> {
  await revokePortalLinks(tx, clientId);
  const id = randomUUID();
  const token = tokenFor(id);
  const [row] = await tx
    .insert(portalTokens)
    .values({ id, trainerId, clientId, tokenHash: hashToken(token) })
    .returning({ createdAt: portalTokens.createdAt });
  return { id, token, createdAt: row.createdAt, lastUsedAt: null };
}
