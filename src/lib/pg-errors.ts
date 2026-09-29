/** Postgres unique_violation (23505), whether raw or wrapped by Drizzle (DrizzleQueryError.cause). */
export function isUniqueViolation(e: unknown): boolean {
  for (let err = e as { code?: string; cause?: unknown } | undefined, i = 0; err && i < 3; err = err.cause as typeof err, i++) {
    if (err.code === "23505") return true;
  }
  return false;
}
