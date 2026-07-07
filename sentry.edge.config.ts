import * as Sentry from "@sentry/nextjs";

// Covers proxy.ts (edge runtime) — see sentry.server.config.ts for the
// Node.js runtime equivalent; both are intentionally identical/minimal.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0,
});
