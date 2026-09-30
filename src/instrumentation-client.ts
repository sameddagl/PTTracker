import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "./lib/sentry";

// No session replay: it would record clients' and trainers' screens.
Sentry.init(sentryOptions);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
