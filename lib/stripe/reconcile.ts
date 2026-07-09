import "server-only";
import { prisma } from "@/lib/prisma";
import { sendOrderAlertEmail, sendOrderConfirmationEmail } from "@/lib/email/orderEmails";

export type ReconcileOutcome =
  | { outcome: "order-not-found" }
  | { outcome: "already-paid" }
  | { outcome: "marked-paid" }
  | { outcome: "already-terminal" } // was already PAID or FAILED, not touched
  | { outcome: "marked-failed" };

// The ONE place a Stripe order's paymentStatus is ever actually set to PAID
// (and the ONE place its confirmation/alert emails ever fire) — called from
// both the webhook (event-driven, real-time) and the admin "Check Payment
// Status" button (polled, on demand), so the two can never send duplicate
// emails or disagree with each other about what happened.
//
// The guard against double-processing MUST be atomic at the database level,
// not a read-then-write. A plain `findUnique` followed by a separate
// `update` has a real race window: two near-simultaneous callers (e.g. a
// webhook retry arriving while the admin's "Check Payment Status" button is
// also mid-request) can both read paymentStatus as not-yet-PAID before
// either one writes, and both then proceed to send duplicate confirmation/
// alert emails. Folding the guard into the UPDATE's own WHERE clause closes
// that window: Postgres serializes concurrent UPDATEs to the same row, so
// only the call that actually flips the row from non-PAID to PAID gets
// count: 1 — every other concurrent or later call for the same order gets
// count: 0 and must not touch the emails. Do not "simplify" this back into
// a separate read + write.
export async function markOrderPaidFromStripe(orderId: string): Promise<ReconcileOutcome> {
  const { count } = await prisma.order.updateMany({
    where: { id: orderId, paymentStatus: { not: "PAID" } },
    data: { paymentStatus: "PAID" },
  });

  if (count === 0) {
    // Either a concurrent call already won this exact race, a genuine
    // duplicate webhook delivery arrived after the order was already marked
    // PAID, or the order id doesn't exist at all — distinguish the last case
    // for logging/debugging, but in every case WE did not just transition
    // this order, so the emails below must not fire again.
    const exists = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } });
    return { outcome: exists ? "already-paid" : "order-not-found" };
  }

  await Promise.allSettled([
    sendOrderConfirmationEmail(orderId),
    sendOrderAlertEmail(orderId),
  ]);

  return { outcome: "marked-paid" };
}

// Only ever moves PENDING -> FAILED. Never regresses a PAID order, and never
// re-processes an order that's already FAILED (both webhook redelivery and
// repeated admin sync clicks can call this more than once for the same
// order). Same atomic-WHERE-guard reasoning as markOrderPaidFromStripe above.
export async function markOrderFailedFromStripe(orderId: string): Promise<ReconcileOutcome> {
  const { count } = await prisma.order.updateMany({
    where: { id: orderId, paymentStatus: "PENDING" },
    data: { paymentStatus: "FAILED" },
  });

  if (count === 0) {
    const exists = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } });
    return { outcome: exists ? "already-terminal" : "order-not-found" };
  }

  return { outcome: "marked-failed" };
}
