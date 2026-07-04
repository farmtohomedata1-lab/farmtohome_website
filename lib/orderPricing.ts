import "server-only";
import { prisma } from "@/lib/prisma";
import type { CouponRate } from "@/lib/cartTotals";

export interface PricedItem {
  productId: string;
  quantity: number;
}

export interface ResolvedLineItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  inStock: boolean;
}

// Re-fetches real current Product rows for the given ids — never trusts a
// client-supplied price. Silently drops ids that no longer exist (deleted
// products) rather than throwing, so one stale cart item doesn't hard-fail
// the whole cart/checkout flow. Shared by /cart's coupon preview and
// /checkout's order placement so both price a cart identically.
export async function resolveLineItems(items: PricedItem[]): Promise<ResolvedLineItem[]> {
  if (items.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((item) => item.productId) } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  return items
    .filter((item) => byId.has(item.productId))
    .map((item) => {
      const product = byId.get(item.productId)!;
      return {
        productId: product.id,
        name: product.name,
        price: product.price.toNumber(),
        quantity: item.quantity,
        inStock: product.inStock,
      };
    });
}

export interface CouponCheckResult {
  valid: boolean;
  error?: string;
  rate?: CouponRate;
  code?: string;
}

// Server-side truth for coupon validity — active flag + date range, code
// normalized to uppercase for lookup. Returns a clear error for every
// rejection reason rather than silently ignoring a bad code. Shared by
// /cart's preview and /checkout's authoritative re-validation at order time.
export async function checkCoupon(code: string): Promise<CouponCheckResult> {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) return { valid: false, error: "Enter a coupon code." };

  const coupon = await prisma.coupon.findUnique({ where: { code: normalizedCode } });
  if (!coupon) return { valid: false, error: "This coupon code doesn't exist." };
  if (!coupon.active) return { valid: false, error: "This coupon is no longer active." };

  const now = new Date();
  if (coupon.startDate && now < coupon.startDate) {
    return { valid: false, error: "This coupon isn't active yet." };
  }
  if (coupon.endDate && now > coupon.endDate) {
    return { valid: false, error: "This coupon has expired." };
  }

  return {
    valid: true,
    code: normalizedCode,
    rate: {
      discountType: coupon.discountType === "PERCENTAGE" ? "PERCENTAGE" : "FIXED",
      discountValue: coupon.discountValue.toNumber(),
    },
  };
}
