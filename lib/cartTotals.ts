// Single source of truth for cart money math — imported by both the client
// (live recompute on every quantity change, no server round-trip) and the
// `validateCoupon` server action (authoritative check), so the two can never
// disagree. No "use client"/"use server" — plain, pure, side-effect-free.

export interface CartLineItem {
  price: number;
  quantity: number;
  // false = this line never contributes to the order's shipping fee.
  chargeShipping: boolean;
  // false = this line is never taxed, even while tax is globally enabled.
  taxable: boolean;
  // Null = use the global tax percentage passed into computeCartTotals.
  taxOverridePercent: number | null;
}

export interface CouponRate {
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
}

export interface TaxSettings {
  taxEnabled: boolean;
  taxPercentage: number;
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

// Per-item exemption sits in front of the existing flat-fee/threshold logic,
// never replaces it: if every line is exempt, shipping is $0 for the whole
// order; otherwise the existing flat fee applies once to the entire order,
// exactly as before this field existed.
export function computeShippingFeeWithExemption(
  items: CartLineItem[],
  amountAfterDiscount: number,
  threshold: number,
  fee: number
): number {
  const anyChargeable = items.some((item) => item.chargeShipping);
  if (!anyChargeable) return 0;
  return computeShippingFee(amountAfterDiscount, threshold, fee);
}

// Tax is computed per line, on that line's price AFTER its proportional
// share of any coupon discount — never on the pre-discount price. A line's
// share of the discount is proportional to its share of the subtotal, so a
// $10-off-$100 coupon shaves 10% off every line's taxable base alike. Always
// 0 when tax is globally disabled, regardless of any per-item setting.
export function computeTaxAmount(
  items: CartLineItem[],
  subtotal: number,
  discount: number,
  taxSettings: TaxSettings
): number {
  if (!taxSettings.taxEnabled) return 0;

  const discountRatio = subtotal > 0 ? discount / subtotal : 0;

  return items.reduce((sum, item) => {
    if (!item.taxable) return sum;
    const lineTotal = item.price * item.quantity;
    const afterDiscount = lineTotal * (1 - discountRatio);
    const rate = item.taxOverridePercent ?? taxSettings.taxPercentage;
    return sum + afterDiscount * (rate / 100);
  }, 0);
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  amountAfterDiscount: number;
  shippingFee: number;
  taxAmount: number;
  total: number;
}

export function computeCartTotals(
  items: CartLineItem[],
  coupon: CouponRate | null,
  threshold: number,
  standardDeliveryFee: number,
  taxSettings: TaxSettings
): CartTotals {
  const subtotal = computeSubtotal(items);
  const discount = computeDiscount(subtotal, coupon);
  const amountAfterDiscount = subtotal - discount;
  const shippingFee = computeShippingFeeWithExemption(
    items,
    amountAfterDiscount,
    threshold,
    standardDeliveryFee
  );
  const taxAmount = computeTaxAmount(items, subtotal, discount, taxSettings);
  const total = amountAfterDiscount + shippingFee + taxAmount;
  return { subtotal, discount, amountAfterDiscount, shippingFee, taxAmount, total };
}
