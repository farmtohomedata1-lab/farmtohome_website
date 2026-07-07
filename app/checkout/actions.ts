"use server";

import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/prisma";
import { requireAuthedCustomer } from "@/lib/auth/customerSession";
import { checkCoupon, resolveLineItems, type PricedItem } from "@/lib/orderPricing";
import { computeCartTotals } from "@/lib/cartTotals";
import { sendOrderAlertEmail, sendOrderConfirmationEmail } from "@/lib/email/orderEmails";
import { checkLoginAllowed, clearLoginAttempts, recordFailedLogin } from "@/lib/auth/rateLimit";
import { getClientIp } from "@/lib/auth/getClientIp";
import { getStripeClient } from "@/lib/stripe/server";

export interface PlaceOrderAddressInput {
  addressId?: string;
  fullName?: string;
  phone?: string;
  blockStreet?: string;
  unitNumber?: string;
  postalCode?: string;
  landmark?: string;
  country?: string;
}

export interface PlaceOrderInput {
  items: PricedItem[];
  couponCode: string | null;
  address: PlaceOrderAddressInput;
  deliveryDate: string | null;
  orderNotes: string;
  paymentMethod: "PAYNOW_MANUAL" | "STRIPE";
}

export interface PlaceOrderResult {
  orderId?: string;
  error?: string;
  // Present only when paymentMethod was STRIPE and the order + PaymentIntent
  // were both created successfully. The client must mount Stripe's Payment
  // Element with this before the order can actually be paid for — it is not
  // a secret (Stripe's client secrets are designed to be used browser-side).
  stripeClientSecret?: string;
}

// Stripe takes amounts in the smallest currency unit (cents for SGD).
// Math.round guards against floating-point noise (e.g. 19.99 * 100 can land
// on 1998.9999999998) turning into an off-by-one-cent charge.
function toStripeCents(dollars: number): number {
  return Math.round(dollars * 100);
}

// The one place an order actually gets created. Re-validates and
// recalculates everything server-side — the same never-trust-the-client
// principle as validateCoupon in app/cart/actions.ts — because a client
// could otherwise submit a fabricated total or price.
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const customer = await requireAuthedCustomer("/checkout");

  if (!input.items || input.items.length === 0) {
    return { error: "Your cart is empty." };
  }
  if (input.paymentMethod !== "PAYNOW_MANUAL" && input.paymentMethod !== "STRIPE") {
    return { error: "Select a valid payment method." };
  }

  const lineItems = await resolveLineItems(input.items);
  if (lineItems.length === 0) {
    return { error: "Your cart items are no longer available." };
  }
  const outOfStock = lineItems.filter((item) => !item.inStock);
  if (outOfStock.length > 0) {
    return {
      error: `${outOfStock.map((i) => i.name).join(", ")} ${
        outOfStock.length === 1 ? "is" : "are"
      } no longer in stock. Please update your cart.`,
    };
  }

  const settings = await prisma.siteSettings.findFirst();

  let coupon = null;
  let normalizedCouponCode: string | null = null;
  if (input.couponCode?.trim()) {
    if (settings?.couponsEnabled === false) {
      return { error: "Coupons are not available right now." };
    }

    // Same IP-keyed lockout as /cart's validateCoupon, sharing the
    // "coupon:" key so a lockout triggered on either page applies to both.
    const rateLimitKey = `coupon:${await getClientIp()}`;
    const gate = await checkLoginAllowed(rateLimitKey);
    if (!gate.allowed) {
      const minutes = Math.ceil(gate.retryAfterSeconds / 60);
      return { error: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` };
    }

    const check = await checkCoupon(input.couponCode);
    if (!check.valid || !check.rate) {
      await recordFailedLogin(rateLimitKey);
      return { error: check.error ?? "That coupon is no longer valid." };
    }
    await clearLoginAttempts(rateLimitKey);
    coupon = check.rate;
    normalizedCouponCode = check.code ?? null;
  }

  const threshold = settings?.freeShippingThreshold.toNumber() ?? 80;
  const fee = settings?.standardDeliveryFee.toNumber() ?? 5;
  const totals = computeCartTotals(lineItems, coupon, threshold, fee);

  let shipping: {
    fullName: string;
    phone: string;
    blockStreet: string;
    unitNumber: string | null;
    postalCode: string;
    landmark: string | null;
  };

  if (input.address.addressId) {
    const existing = await prisma.address.findUnique({ where: { id: input.address.addressId } });
    if (!existing || existing.customerId !== customer.id) {
      return { error: "Selected address not found." };
    }
    shipping = {
      fullName: existing.fullName,
      phone: existing.phone,
      blockStreet: existing.blockStreet,
      unitNumber: existing.unitNumber,
      postalCode: existing.postalCode,
      landmark: existing.landmark,
    };
  } else {
    const { fullName, phone, blockStreet, unitNumber, postalCode, landmark, country } =
      input.address;
    if (!fullName?.trim() || !phone?.trim() || !blockStreet?.trim() || !postalCode?.trim()) {
      return { error: "Fill in all required address fields." };
    }
    if (!/^\d{6}$/.test(postalCode.trim())) {
      return { error: "Enter a valid 6-digit postal code." };
    }
    // Only one real option exists ("Singapore") but the selection is never
    // silently assumed — a client bypassing the dropdown UI is rejected here
    // exactly like every other required field above.
    if (country?.trim() !== "Singapore") {
      return { error: "Please select a country." };
    }
    shipping = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      blockStreet: blockStreet.trim(),
      unitNumber: unitNumber?.trim() || null,
      postalCode: postalCode.trim(),
      landmark: landmark?.trim() || null,
    };

    // Auto-save every newly-typed address to the customer's address book —
    // no opt-in checkbox. The very first address a customer ever saves
    // becomes "Home 1" and the default; every one after that is labeled
    // "Home N" but never touches whichever address is already the default,
    // so a one-off delivery (e.g. a gift address) can't silently steal that
    // spot.
    const existingAddressCount = await prisma.address.count({
      where: { customerId: customer.id },
    });
    const isFirstAddress = existingAddressCount === 0;
    await prisma.address
      .create({
        data: {
          customerId: customer.id,
          label: `Home ${existingAddressCount + 1}`,
          isDefault: isFirstAddress,
          ...shipping,
        },
      })
      .catch((err) => console.error("[checkout] auto-saving new address failed:", err));
  }

  const deliveryDate = input.deliveryDate ? new Date(input.deliveryDate) : null;

  let orderId: string;
  try {
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        email: customer.email,
        shippingFullName: shipping.fullName,
        shippingPhone: shipping.phone,
        shippingBlockStreet: shipping.blockStreet,
        shippingUnitNumber: shipping.unitNumber,
        shippingPostalCode: shipping.postalCode,
        landmark: shipping.landmark,
        deliveryDate,
        orderNotes: input.orderNotes?.trim() || null,
        paymentMethod: input.paymentMethod,
        subtotal: totals.subtotal,
        discountAmount: totals.discount,
        shippingFee: totals.shippingFee,
        total: totals.total,
        couponCode: normalizedCouponCode,
        items: {
          create: lineItems.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      },
    });
    orderId = order.id;
  } catch (err) {
    console.error("[checkout] order creation failed:", err);
    Sentry.captureException(err);
    return { error: "Failed to place your order. Please try again." };
  }

  if (input.paymentMethod === "STRIPE") {
    const stripeResult = await createStripePaymentIntentForOrder(orderId, totals.total);
    if (stripeResult.error) return { error: stripeResult.error };
    // Emails for a Stripe order are sent by the webhook once payment
    // genuinely succeeds — never here, since at this point we have no idea
    // yet whether the customer will actually complete payment.
    return { orderId, stripeClientSecret: stripeResult.clientSecret };
  }

  // PayNow: unchanged — emails send immediately, same as before Stripe existed.
  await Promise.allSettled([sendOrderConfirmationEmail(orderId), sendOrderAlertEmail(orderId)]);

  return { orderId };
}

interface StripeIntentResult {
  clientSecret?: string;
  error?: string;
}

async function createStripePaymentIntentForOrder(
  orderId: string,
  totalDollars: number,
  idempotencySuffix: string = "create"
): Promise<StripeIntentResult> {
  const stripe = getStripeClient();
  if (!stripe) {
    console.error(
      `[checkout] STRIPE_SECRET_KEY not configured — order ${orderId} has no PaymentIntent.`
    );
    return { error: "Card payments are not available right now. Please try PayNow instead." };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: toStripeCents(totalDollars),
        currency: "sgd",
        // Deliberately NOT automatic_payment_methods — this Stripe account
        // has PayNow enabled too, and "automatic" would offer it as a
        // second, redundant PayNow option nested inside our own "Card" step
        // (on top of the app's own separate manual-QR PayNow flow). "Card"
        // in our UI must only ever mean card.
        payment_method_types: ["card"],
        metadata: { orderId },
      },
      { idempotencyKey: `order-${orderId}-${idempotencySuffix}` }
    );

    await prisma.order.update({
      where: { id: orderId },
      data: { stripePaymentIntentId: paymentIntent.id, paymentStatus: "PENDING" },
    });

    return { clientSecret: paymentIntent.client_secret ?? undefined };
  } catch (err) {
    console.error(`[checkout] Stripe PaymentIntent creation failed for order ${orderId}:`, err);
    Sentry.captureException(err);
    return { error: "Couldn't set up card payment. Please try again." };
  }
}

export interface RetryStripePaymentResult {
  clientSecret?: string;
  error?: string;
}

// Re-attempt payment on an existing Stripe order after a decline/failure —
// creates a FRESH PaymentIntent linked to the SAME order (stripePaymentIntentId
// is overwritten), never a new Order row, so a retry can never duplicate an
// order. A fresh random idempotency suffix per call is deliberate here
// (unlike the stable one used at initial creation): each retry must always
// get its own new PaymentIntent, never a cached one from a previous attempt.
export async function retryStripePayment(orderId: string): Promise<RetryStripePaymentResult> {
  const customer = await requireAuthedCustomer("/account");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.customerId !== customer.id) {
    return { error: "Order not found." };
  }
  if (order.paymentMethod !== "STRIPE") {
    return { error: "This order doesn't use card payment." };
  }
  if (order.paymentStatus === "PAID") {
    return { error: "This order has already been paid." };
  }

  return createStripePaymentIntentForOrder(orderId, order.total.toNumber(), `retry-${crypto.randomUUID()}`);
}

export interface OrderPaymentStatusResult {
  paymentStatus?: string;
  error?: string;
}

// Polled by the order-confirmation page for Stripe orders. The webhook (see
// app/api/webhooks/stripe/route.ts) is the ONLY thing that ever sets
// paymentStatus to PAID/FAILED for a Stripe order — this just reads whatever
// it has already decided, never the browser's own redirect outcome.
export async function getOrderPaymentStatus(orderId: string): Promise<OrderPaymentStatusResult> {
  const customer = await requireAuthedCustomer("/account");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.customerId !== customer.id) {
    return { error: "Order not found." };
  }

  return { paymentStatus: order.paymentStatus };
}

// Customer-facing "I've made the payment" — intent only. This is the ONLY
// customer-reachable code path that touches customerDeclaredPaid, and it
// must never set paymentStatus. Only app/admin/(protected)/orders/actions.ts's
// markOrderPaid can do that.
export async function declarePaymentMade(orderId: string): Promise<{ error?: string }> {
  const customer = await requireAuthedCustomer("/account");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.customerId !== customer.id) {
    return { error: "Order not found." };
  }
  if (order.paymentMethod !== "PAYNOW_MANUAL") {
    return { error: "This order doesn't use PayNow." };
  }

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { customerDeclaredPaid: true },
    });
  } catch (err) {
    console.error(`[checkout] declarePaymentMade(${orderId}) failed:`, err);
    Sentry.captureException(err);
    return { error: "Failed to update. Please try again." };
  }

  return {};
}
