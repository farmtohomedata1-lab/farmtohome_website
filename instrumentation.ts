import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captures errors from Server Components, Route Handlers (including the
// Stripe webhook), and proxy.ts automatically. Server Actions are NOT
// covered by this hook — see the Sentry.captureException calls added
// alongside existing catch blocks in checkout/admin actions instead, since
// most of those already catch their own errors and turn them into a
// `{ error }` return value rather than throwing (which this hook can't see).
export const onRequestError = Sentry.captureRequestError;
