import type { Breadcrumb, ErrorEvent, Event } from "@sentry/nextjs";

type TransactionEvent = Event & { type: "transaction" };

// Shared Sentry settings for the browser, Node and edge runtimes. Errors only
// reach Sentry in production with a DSN set, and never carry personal data:
// no user, cookies, headers, request bodies or query strings, and client
// portal tokens are masked (a /p/<token> URL is a key to a client's data).

export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
export const sentryEnabled = process.env.NODE_ENV === "production" && !!SENTRY_DSN;

const TOKEN_IN_PATH = /\/p\/[A-Za-z0-9_-]{32}/g;
export const maskTokens = (s: string) => s.replace(TOKEN_IN_PATH, "/p/[token]");
const stripQuery = (url: string) => maskTokens(url.split(/[?#]/)[0]);

function scrub<E extends ErrorEvent | TransactionEvent>(event: E): E {
  delete event.user;
  if (event.request) {
    event.request = { method: event.request.method, url: event.request.url ? stripQuery(event.request.url) : undefined };
  }
  if (event.transaction) event.transaction = maskTokens(event.transaction);
  if (event.tags?.url && typeof event.tags.url === "string") event.tags.url = stripQuery(event.tags.url);
  if (event.message) event.message = maskTokens(event.message);
  for (const ex of event.exception?.values ?? []) if (ex.value) ex.value = maskTokens(ex.value);
  event.breadcrumbs = event.breadcrumbs?.map(scrubBreadcrumb).filter((b: Breadcrumb | null): b is Breadcrumb => b !== null);
  return event;
}

export function scrubBreadcrumb(b: Breadcrumb): Breadcrumb | null {
  // Form input values can hold names, phones or health notes.
  if (b.category === "ui.input") return null;
  if (b.message) b.message = maskTokens(b.message);
  if (b.data) {
    for (const k of ["url", "from", "to"] as const) {
      if (typeof b.data[k] === "string") b.data[k] = stripQuery(b.data[k] as string);
    }
  }
  return b;
}

export const sentryOptions = {
  dsn: SENTRY_DSN,
  enabled: sentryEnabled,
  environment: process.env.NODE_ENV,
  sendDefaultPii: false,
  // A light sample of performance traces is enough to spot slow pages on the free plan.
  tracesSampleRate: 0.05,
  beforeSend: (e: ErrorEvent) => scrub(e),
  beforeSendTransaction: (e: TransactionEvent) => scrub(e),
  beforeBreadcrumb: scrubBreadcrumb,
};
