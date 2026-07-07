import * as Sentry from "@sentry/nextjs";

// Browser-side init — catches unhandled client errors (e.g. a bug in
// StripePaymentForm's confirm flow) the same way sentry.server.config.ts
// catches server-side ones.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0,
});

// Silences a build warning; harmless no-op alongside tracesSampleRate: 0
// (no performance tracing means there's nothing for it to actually record).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
