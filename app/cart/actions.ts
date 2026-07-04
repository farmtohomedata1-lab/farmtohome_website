"use server";

import { computeDiscount, computeSubtotal } from "@/lib/cartTotals";
import { checkCoupon, resolveLineItems, type PricedItem } from "@/lib/orderPricing";

export interface ValidateCouponResult {
  valid: boolean;
  error?: string;
  subtotal: number;
  discount: number;
  discountType?: "PERCENTAGE" | "FIXED";
  discountValue?: number;
}

// Server-side truth for coupon application. Never trusts a client-supplied
// price or subtotal — re-fetches real current Product prices for the given
// ids and recomputes subtotal from those, so a tampered client can't lie
// about what the cart is actually worth. The discount rate returned here
// is the only thing the client is allowed to treat as authoritative.
export async function validateCoupon(
  code: string,
  items: PricedItem[]
): Promise<ValidateCouponResult> {
  const lineItems = await resolveLineItems(items);
  const subtotal = computeSubtotal(lineItems);

  const check = await checkCoupon(code);
  if (!check.valid || !check.rate) {
    return { valid: false, error: check.error, subtotal, discount: 0 };
  }

  return {
    valid: true,
    subtotal,
    discount: computeDiscount(subtotal, check.rate),
    discountType: check.rate.discountType,
    discountValue: check.rate.discountValue,
  };
}
