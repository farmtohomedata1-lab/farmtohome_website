"use server";

import { prisma } from "@/lib/prisma";
import { requireAuthedCustomer } from "@/lib/auth/customerSession";
import { checkCoupon, resolveLineItems, type PricedItem } from "@/lib/orderPricing";
import { computeCartTotals } from "@/lib/cartTotals";
import { sendOrderAlertEmail, sendOrderConfirmationEmail } from "@/lib/email/orderEmails";

export interface PlaceOrderAddressInput {
  addressId?: string;
  fullName?: string;
  phone?: string;
  blockStreet?: string;
  unitNumber?: string;
  postalCode?: string;
  landmark?: string;
}

export interface PlaceOrderInput {
  items: PricedItem[];
  couponCode: string | null;
  address: PlaceOrderAddressInput;
  deliveryDate: string | null;
  orderNotes: string;
  paymentMethod: "COD" | "PAYNOW_MANUAL";
}

export interface PlaceOrderResult {
  orderId?: string;
  error?: string;
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
  if (input.paymentMethod !== "COD" && input.paymentMethod !== "PAYNOW_MANUAL") {
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

  let coupon = null;
  let normalizedCouponCode: string | null = null;
  if (input.couponCode?.trim()) {
    const check = await checkCoupon(input.couponCode);
    if (!check.valid || !check.rate) {
      return { error: check.error ?? "That coupon is no longer valid." };
    }
    coupon = check.rate;
    normalizedCouponCode = check.code ?? null;
  }

  const settings = await prisma.siteSettings.findFirst();
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
    const { fullName, phone, blockStreet, unitNumber, postalCode, landmark } = input.address;
    if (!fullName?.trim() || !phone?.trim() || !blockStreet?.trim() || !postalCode?.trim()) {
      return { error: "Fill in all required address fields." };
    }
    if (!/^\d{6}$/.test(postalCode.trim())) {
      return { error: "Enter a valid 6-digit postal code." };
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
    return { error: "Failed to place your order. Please try again." };
  }

  // Email failures are logged inside these functions and never block a
  // successfully placed order from returning.
  await Promise.allSettled([sendOrderConfirmationEmail(orderId), sendOrderAlertEmail(orderId)]);

  return { orderId };
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
    return { error: "Failed to update. Please try again." };
  }

  return {};
}
