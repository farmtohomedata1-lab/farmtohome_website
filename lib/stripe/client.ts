import { loadStripe, type Stripe } from "@stripe/stripe-js";

// Module-level singleton so <Elements> never re-triggers loading Stripe.js
// on every render — the standard @stripe/stripe-js pattern. Only ever reads
// the PUBLISHABLE key (safe to ship to the browser by design); the secret
// key never appears anywhere in client code (see lib/stripe/server.ts).
let stripePromise: Promise<Stripe | null> | undefined;

export function getStripePromise(): Promise<Stripe | null> {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    stripePromise = publishableKey ? loadStripe(publishableKey) : Promise.resolve(null);
  }
  return stripePromise;
}
