import "server-only";
import Stripe from "stripe";

let cachedClient: Stripe | null | undefined;
let warnedMissing = false;

// Lazy + cached, same pattern as lib/email/resend.ts's getResendClient — the
// "is the key actually defined in THIS process" check runs on every call so
// a long-lived server started before STRIPE_SECRET_KEY was added never gets
// stuck caching `null` forever. Missing key no-ops rather than crashing;
// callers (app/checkout/actions.ts) turn a null client into a clear
// "Card payments are not available right now" error instead of letting
// Stripe.SDK construction throw.
export function getStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    if (!warnedMissing) {
      console.warn("[stripe] STRIPE_SECRET_KEY is not set — card payments will be unavailable.");
      warnedMissing = true;
    }
    cachedClient = null;
    return null;
  }

  if (cachedClient === undefined || cachedClient === null) {
    cachedClient = new Stripe(secretKey);
  }
  return cachedClient;
}
