import "server-only";
import * as Sentry from "@sentry/nextjs";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe/server";
import { markOrderFailedFromStripe, markOrderPaidFromStripe } from "@/lib/stripe/reconcile";

// Stripe's own default (Webhook.DEFAULT_TOLERANCE in the SDK) — confirmed by
// reading node_modules/stripe's source rather than assuming. constructEvent
// already applies this if no tolerance is passed at all, so passing it
// explicitly changes no behavior; it's here so replay protection is visible
// in this file instead of requiring a trip into the SDK source to confirm it
// exists. Rejects any event whose signed timestamp is more than 5 minutes
// old (or from the future), so a captured signature+payload can't be
// replayed later even though the signature itself is still technically
// valid indefinitely.
const WEBHOOK_TOLERANCE_SECONDS = 300;

// Single-line, greppable summary emitted for every request this endpoint
// receives, whatever happens to it — the whole point is that "did a webhook
// ever arrive, and what did we do with it" should never require guessing
// from silence. `signature` is "pass"/"fail"/"missing"/"unconfigured" so a
// failure mode is identifiable without reading the surrounding prose.
function logWebhookAttempt(fields: Record<string, string | undefined>): void {
  const timestamp = new Date().toISOString();
  const parts = Object.entries(fields)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
  console.log(`[stripe webhook] ${timestamp} ${parts}`);
}

// This endpoint is the ONLY place a Stripe order's paymentStatus ever
// becomes PAID or FAILED from a live payment event — never the customer's
// browser redirecting back "successfully" (see the order-confirmation page,
// which polls the DB instead of trusting its own arrival). Must be a Route
// Handler, not a Server Action: Stripe's servers POST here directly over
// plain HTTP. When this endpoint is unreachable at the moment Stripe tries
// to deliver (see lib/stripe/reconcile.ts's other caller, the admin "Check
// Payment Status" button, for the manual recovery path for exactly that).
export async function POST(request: Request): Promise<Response> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = getStripeClient();

  if (!webhookSecret || !stripe) {
    logWebhookAttempt({ signature: "unconfigured", outcome: "rejected" });
    console.error(
      "[stripe webhook] STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY not configured — rejecting request."
    );
    return new Response("Webhook not configured", { status: 503 });
  }

  const signatureHeader = request.headers.get("stripe-signature");
  if (!signatureHeader) {
    logWebhookAttempt({ signature: "missing", outcome: "rejected" });
    return new Response("Missing signature", { status: 400 });
  }

  // Signature verification needs the exact raw bytes Stripe signed — must
  // read as text, never request.json(), or the signature will never match.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signatureHeader,
      webhookSecret,
      WEBHOOK_TOLERANCE_SECONDS
    );
  } catch (err) {
    // Reject anything that fails verification before trusting a single
    // field of its payload — this is the entire point of signing.
    logWebhookAttempt({
      signature: "fail",
      outcome: "rejected",
      reason: JSON.stringify(err instanceof Error ? err.message : String(err)),
    });
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    let outcome: string;
    switch (event.type) {
      case "payment_intent.succeeded":
        outcome = await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        outcome = await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        // Not an event type we act on — still acknowledge so Stripe stops
        // retrying delivery of it.
        outcome = "ignored-event-type";
        break;
    }
    logWebhookAttempt({
      signature: "pass",
      event: event.type,
      eventId: event.id,
      outcome,
    });
  } catch (err) {
    logWebhookAttempt({
      signature: "pass",
      event: event.type,
      eventId: event.id,
      outcome: "handler-threw",
    });
    console.error(`[stripe webhook] handling ${event.type} threw:`, err);
    // This catch converts the error into a normal 500 Response rather than
    // rethrowing, so instrumentation.ts's onRequestError never sees it —
    // report it explicitly, since a swallowed error on the ONE path that
    // ever marks a Stripe order PAID is exactly the kind of failure that
    // must not go unnoticed.
    Sentry.captureException(err);
    // 500 tells Stripe to retry later — appropriate for a transient error
    // (e.g. a DB hiccup), unlike the 400s above which are permanent.
    return new Response("Internal error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<string> {
  const order = await prisma.order.findUnique({
    where: { stripePaymentIntentId: paymentIntent.id },
  });
  if (!order) return `order-not-found:${paymentIntent.id}`;

  const result = await markOrderPaidFromStripe(order.id);
  return `${result.outcome}:${order.id}`;
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<string> {
  const order = await prisma.order.findUnique({
    where: { stripePaymentIntentId: paymentIntent.id },
  });
  if (!order) return `order-not-found:${paymentIntent.id}`;

  const result = await markOrderFailedFromStripe(order.id);
  return `${result.outcome}:${order.id}`;
}
