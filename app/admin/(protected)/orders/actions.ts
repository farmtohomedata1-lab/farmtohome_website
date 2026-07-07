"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuthedUser } from "@/lib/auth/session";
import { getStripeClient } from "@/lib/stripe/server";
import { markOrderFailedFromStripe, markOrderPaidFromStripe } from "@/lib/stripe/reconcile";
import { logAdminAction } from "@/lib/audit/log";

// The ONLY code path anywhere in the app that ever sets paymentStatus to
// PAID for a manually-paid (PayNow) order. Customer-side, `declarePaymentMade`
// in app/checkout/actions.ts only ever touches customerDeclaredPaid — never
// this field — precisely so a customer can never mark their own order paid.
export async function markOrderPaid(orderId: string): Promise<{ error?: string }> {
  const admin = await requireAuthedUser();

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID" },
    });
  } catch (err) {
    console.error(`[admin/orders] markOrderPaid(${orderId}) failed:`, err);
    Sentry.captureException(err);
    return { error: "Failed to update. Please try again." };
  }

  await logAdminAction(admin.email ?? "unknown", {
    action: "order.marked_paid",
    targetType: "Order",
    targetId: orderId,
  });
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return {};
}

export interface CheckStripePaymentStatusResult {
  error?: string;
  message?: string;
  stripeStatus?: string;
}

// Manual recovery for exactly the scenario a missed/delayed webhook creates:
// asks Stripe itself for the PaymentIntent's real current status — never a
// guess — and reconciles our order to match. Shares markOrderPaidFromStripe/
// markOrderFailedFromStripe with the webhook (lib/stripe/reconcile.ts) so
// this can never send a duplicate confirmation email if the webhook and an
// admin click race each other, and can never disagree with the webhook
// about what "PAID" means.
export async function checkStripePaymentStatus(
  orderId: string
): Promise<CheckStripePaymentStatusResult> {
  const admin = await requireAuthedUser();

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Order not found." };
  if (order.paymentMethod !== "STRIPE") {
    return { error: "This order doesn't use Stripe." };
  }
  if (!order.stripePaymentIntentId) {
    return { error: "This order has no linked Stripe payment to check." };
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return { error: "Stripe isn't configured right now." };
  }

  let stripeStatus: string;
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
    stripeStatus = paymentIntent.status;
  } catch (err) {
    console.error(`[admin/orders] checkStripePaymentStatus(${orderId}) retrieve failed:`, err);
    Sentry.captureException(err);
    return { error: "Couldn't reach Stripe. Please try again." };
  }

  if (stripeStatus === "succeeded") {
    let result;
    try {
      result = await markOrderPaidFromStripe(orderId);
    } catch (err) {
      console.error(`[admin/orders] checkStripePaymentStatus(${orderId}) markOrderPaidFromStripe failed:`, err);
      Sentry.captureException(err);
      return { error: "Stripe confirms this payment succeeded, but saving that failed. Please try again." };
    }
    if (result.outcome === "marked-paid") {
      await logAdminAction(admin.email ?? "unknown", {
        action: "order.stripe_sync_marked_paid",
        targetType: "Order",
        targetId: orderId,
        metadata: { stripeStatus },
      });
    }
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    return {
      stripeStatus,
      message:
        result.outcome === "already-paid"
          ? "Already marked PAID — no change needed."
          : "Stripe confirms this payment succeeded. Marked PAID and sent the confirmation/alert emails.",
    };
  }

  if (stripeStatus === "canceled") {
    let result;
    try {
      result = await markOrderFailedFromStripe(orderId);
    } catch (err) {
      console.error(`[admin/orders] checkStripePaymentStatus(${orderId}) markOrderFailedFromStripe failed:`, err);
      Sentry.captureException(err);
      return { error: "Stripe reports this payment was canceled, but saving that failed. Please try again." };
    }
    if (result.outcome === "marked-failed") {
      await logAdminAction(admin.email ?? "unknown", {
        action: "order.stripe_sync_marked_failed",
        targetType: "Order",
        targetId: orderId,
        metadata: { stripeStatus },
      });
    }
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    return {
      stripeStatus,
      message:
        result.outcome === "already-terminal"
          ? "Order status unchanged — already resolved."
          : "Stripe reports this payment was canceled. Marked FAILED.",
    };
  }

  // requires_payment_method / requires_confirmation / requires_action /
  // processing / requires_capture — genuinely unresolved on Stripe's side
  // too. Show that plainly rather than forcing a status change that isn't
  // true yet.
  return {
    stripeStatus,
    message: `Stripe shows this payment as "${stripeStatus}" — still in progress, not confirmed either way yet.`,
  };
}
