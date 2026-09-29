import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, asc, desc, eq, gte, inArray, isNull } from "drizzle-orm";
import { adminDb, type Tx } from "@/db";
import { clientPackageBalances, clientPackages, clients, lessonAttendees, lessons, portalTokens, trainers } from "@/db/schema";

// Client portal links: /p/<token>. The token is shown once and only its hash
// is stored, so a database leak does not expose working links.

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Creates a new link for a client, revoking earlier ones. Call inside withTrainer. */
export async function createPortalToken(tx: Tx, trainerId: string, clientId: string) {
  const token = randomBytes(24).toString("base64url");
  await tx
    .update(portalTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(portalTokens.clientId, clientId), isNull(portalTokens.revokedAt)));
  await tx.insert(portalTokens).values({ trainerId, clientId, tokenHash: hash(token) });
  return token;
}

/**
 * Resolves a portal token without a signed-in user. Uses adminDb (no RLS), so
 * every query below is filtered by the client id bound to the token.
 */
export async function getPortalData(token: string) {
  if (!/^[A-Za-z0-9_-]{32}$/.test(token)) return null;

  const [link] = await adminDb
    .select({ id: portalTokens.id, clientId: portalTokens.clientId, trainerId: portalTokens.trainerId })
    .from(portalTokens)
    .where(and(eq(portalTokens.tokenHash, hash(token)), isNull(portalTokens.revokedAt)));
  if (!link) return null;

  const [client] = await adminDb
    .select({ fullName: clients.fullName, trainerName: trainers.fullName, businessName: trainers.businessName, timezone: trainers.timezone })
    .from(clients)
    .innerJoin(trainers, eq(trainers.id, clients.trainerId))
    .where(and(eq(clients.id, link.clientId), isNull(clients.archivedAt)));
  if (!client) return null;

  const packages = await adminDb
    .select({
      id: clientPackages.id,
      name: clientPackages.name,
      total: clientPackages.totalSessions,
      remaining: clientPackageBalances.remainingSessions,
      expiresOn: clientPackageBalances.effectiveExpiresOn,
      due: clientPackageBalances.dueAmount,
      state: clientPackageBalances.state,
    })
    .from(clientPackages)
    .innerJoin(clientPackageBalances, eq(clientPackageBalances.clientPackageId, clientPackages.id))
    .where(and(eq(clientPackages.clientId, link.clientId), inArray(clientPackageBalances.state, ["active", "frozen"])))
    .orderBy(desc(clientPackages.startsOn));

  const upcoming = await adminDb
    .select({ startsAt: lessons.startsAt, sessionType: lessons.sessionType })
    .from(lessonAttendees)
    .innerJoin(lessons, eq(lessons.id, lessonAttendees.lessonId))
    .where(
      and(
        eq(lessonAttendees.clientId, link.clientId),
        eq(lessonAttendees.status, "scheduled"),
        eq(lessons.status, "scheduled"),
        gte(lessons.startsAt, new Date()),
      ),
    )
    .orderBy(asc(lessons.startsAt))
    .limit(5);

  await adminDb.update(portalTokens).set({ lastUsedAt: new Date() }).where(eq(portalTokens.id, link.id));

  return { client, packages, upcoming };
}
