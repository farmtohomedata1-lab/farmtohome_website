import * as Sentry from "@sentry/nextjs";

// Same graceful-no-op pattern as Stripe/Turnstile elsewhere in this app: if
// NEXT_PUBLIC_SENTRY_DSN is unset, Sentry.init with dsn: undefined disables
// the SDK entirely rather than erroring, so nothing here needs its own
// "is this configured" branch.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Error tracking only, no performance tracing — keeps this within
  // Sentry's free tier without needing to tune sampling rates.
  tracesSampleRate: 0,
});
