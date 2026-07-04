// Single source of truth for cart money math — imported by both the client
// (live recompute on every quantity change, no server round-trip) and the
// `validateCoupon` server action (authoritative check), so the two can never
// disagree. No "use client"/"use server" — plain, pure, side-effect-free.

export interface CartLineItem {
  price: number;
  quantity: number;
}

export interface CouponRate {
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
}

export function computeSubtotal(items: CartLineItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// Clamped to the subtotal for BOTH discount types. The ticket only spells
// out the cap for FIXED ("never let a fixed discount push total negative"),
// but a PERCENTAGE coupon mistakenly saved with a value over 100 would
// otherwise do the same thing — clamping universally closes that hole
// without changing the result for any legitimate (<=100%) percentage.
export function computeDiscount(subtotal: number, coupon: CouponRate | null): number {
  if (!coupon) return 0;
  const raw =
    coupon.discountType === "PERCENTAGE"
      ? subtotal * (coupon.discountValue / 100)
      : coupon.discountValue;
  return Math.min(Math.max(raw, 0), subtotal);
}

export function computeShippingFee(
  amountAfterDiscount: number,
  threshold: number,
  fee: number
): number {
  return amountAfterDiscount >= threshold ? 0 : fee;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  amountAfterDiscount: number;
  shippingFee: number;
  total: number;
}

export function computeCartTotals(
  items: CartLineItem[],
  coupon: CouponRate | null,
  threshold: number,
  standardDeliveryFee: number
): CartTotals {
  const subtotal = computeSubtotal(items);
  const discount = computeDiscount(subtotal, coupon);
  const amountAfterDiscount = subtotal - discount;
  const shippingFee = computeShippingFee(amountAfterDiscount, threshold, standardDeliveryFee);
  const total = amountAfterDiscount + shippingFee;
  return { subtotal, discount, amountAfterDiscount, shippingFee, total };
}
