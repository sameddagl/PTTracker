import * as Sentry from "@sentry/nextjs";

export async function register() {
  const { sentryOptions } = await import("./lib/sentry");
  Sentry.init(sentryOptions);
}

// Server errors in rendering, route handlers and server actions.
export const onRequestError = Sentry.captureRequestError;
