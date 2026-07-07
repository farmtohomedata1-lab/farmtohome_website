"use server";

import { prisma } from "@/lib/prisma";
import { computeDiscount, computeSubtotal } from "@/lib/cartTotals";
import { checkCoupon, resolveLineItems, type PricedItem } from "@/lib/orderPricing";
import { checkLoginAllowed, clearLoginAttempts, recordFailedLogin } from "@/lib/auth/rateLimit";
import { getClientIp } from "@/lib/auth/getClientIp";

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
//
// This endpoint has no session/auth of its own (guest checkout is allowed),
// so it's rate-limited by IP using the exact same lockout mechanism as login
// (lib/auth/rateLimit.ts) — keyed under a "coupon:" prefix so it can never
// collide with a real login email or the signup counter that reuses the
// same table.
export async function validateCoupon(
  code: string,
  items: PricedItem[]
): Promise<ValidateCouponResult> {
  const lineItems = await resolveLineItems(items);
  const subtotal = computeSubtotal(lineItems);

  const settings = await prisma.siteSettings.findFirst();
  if (settings?.couponsEnabled === false) {
    return { valid: false, error: "Coupons are not available right now.", subtotal, discount: 0 };
  }

  const rateLimitKey = `coupon:${await getClientIp()}`;
  const gate = await checkLoginAllowed(rateLimitKey);
  if (!gate.allowed) {
    const minutes = Math.ceil(gate.retryAfterSeconds / 60);
    return {
      valid: false,
      error: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      subtotal,
      discount: 0,
    };
  }

  const check = await checkCoupon(code);
  if (!check.valid || !check.rate) {
    await recordFailedLogin(rateLimitKey);
    return { valid: false, error: check.error, subtotal, discount: 0 };
  }
  await clearLoginAttempts(rateLimitKey);

  return {
    valid: true,
    subtotal,
    discount: computeDiscount(subtotal, check.rate),
    discountType: check.rate.discountType,
    discountValue: check.rate.discountValue,
  };
}
