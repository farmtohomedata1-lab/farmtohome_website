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
export async function markOrderPaidFromStripe(orderId: string): Promise<ReconcileOutcome> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { outcome: "order-not-found" };
  if (order.paymentStatus === "PAID") return { outcome: "already-paid" };

  await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: "PAID" } });

  await Promise.allSettled([
    sendOrderConfirmationEmail(orderId),
    sendOrderAlertEmail(orderId),
  ]);

  return { outcome: "marked-paid" };
}

// Only ever moves PENDING -> FAILED. Never regresses a PAID order, and never
// re-processes an order that's already FAILED (both webhook redelivery and
// repeated admin sync clicks can call this more than once for the same
// order).
export async function markOrderFailedFromStripe(orderId: string): Promise<ReconcileOutcome> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { outcome: "order-not-found" };
  if (order.paymentStatus !== "PENDING") return { outcome: "already-terminal" };

  await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: "FAILED" } });
  return { outcome: "marked-failed" };
}
