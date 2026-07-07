"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/cartStore";
import { computeCartTotals, type CouponRate } from "@/lib/cartTotals";
import FreeShippingBar from "./FreeShippingBar";
import CartItemRow from "./CartItemRow";
import CouponForm from "./CouponForm";
import CartSummary from "./CartSummary";

export default function CartClient({
  freeShippingThreshold,
  standardDeliveryFee,
  couponsEnabled,
  taxEnabled,
  taxPercentage,
}: {
  freeShippingThreshold: number;
  standardDeliveryFee: number;
  couponsEnabled: boolean;
  taxEnabled: boolean;
  taxPercentage: number;
}) {
  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  const [appliedCoupon, setAppliedCoupon] = useState<(CouponRate & { code: string }) | null>(
    null
  );

  const totals = computeCartTotals(
    items,
    appliedCoupon,
    freeShippingThreshold,
    standardDeliveryFee,
    { taxEnabled, taxPercentage }
  );

  function handleClearAll() {
    if (!window.confirm("Clear your entire cart? This can't be undone.")) return;
    clearCart();
    setAppliedCoupon(null);
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[1320px] px-4 py-16 text-center sm:px-6">
        <p className="text-lg font-semibold text-dark-green">Your cart is empty</p>
        <p className="mt-2 text-sm text-gray-500">
          Looks like you haven&apos;t added anything yet.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-md bg-brand-green px-6 py-3 text-sm font-semibold text-white"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-6">
      <FreeShippingBar
        subtotal={totals.subtotal}
        threshold={freeShippingThreshold}
        shippingFee={totals.shippingFee}
      />

      <div className="mt-6 lg:flex lg:items-start lg:gap-8">
        <div className="min-w-0 flex-1">
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="hidden border-b border-gray-200 bg-gray-section px-4 py-3 text-xs uppercase text-gray-500 sm:flex sm:items-center">
              <span className="flex-1">Product</span>
              <span className="flex items-center gap-8">
                <span className="w-16">Price</span>
                <span className="w-[7.5rem] text-center">Quantity</span>
                <span className="w-20 text-right">Subtotal</span>
              </span>
            </div>
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <CartItemRow
                  key={item.productId}
                  item={item}
                  onQuantityChange={(quantity) => setQuantity(item.productId, quantity)}
                  onRemove={() => removeItem(item.productId)}
                />
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <Link href="/shop" className="text-sm font-semibold text-brand-green hover:underline">
              ← Continue Shopping
            </Link>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-sm font-semibold text-red-600 hover:underline"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="mt-8 w-full shrink-0 lg:mt-0 lg:w-80">
          {couponsEnabled && (
            <CouponForm
              items={items}
              appliedCode={appliedCoupon?.code ?? null}
              onApplied={(code, rate) => setAppliedCoupon({ ...rate, code })}
              onCleared={() => setAppliedCoupon(null)}
            />
          )}
          <CartSummary totals={totals} appliedCode={appliedCoupon?.code ?? null} />
        </div>
      </div>
    </div>
  );
}
