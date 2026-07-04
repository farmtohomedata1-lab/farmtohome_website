"use client";

import { useState, useTransition } from "react";
import type { CartItem } from "@/lib/cartStore";
import type { CouponRate } from "@/lib/cartTotals";
import { validateCoupon } from "@/app/cart/actions";

export default function CouponForm({
  items,
  appliedCode,
  onApplied,
  onCleared,
}: {
  items: CartItem[];
  appliedCode: string | null;
  onApplied: (code: string, rate: CouponRate) => void;
  onCleared: () => void;
}) {
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  function handleApply() {
    const trimmed = code.trim();
    setMessage(null);
    startTransition(async () => {
      const result = await validateCoupon(
        trimmed,
        items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
      );
      if (!result.valid || !result.discountType || result.discountValue == null) {
        setMessage({ type: "error", text: result.error ?? "This coupon couldn't be applied." });
        return;
      }
      onApplied(trimmed.toUpperCase(), {
        discountType: result.discountType,
        discountValue: result.discountValue,
      });
      setMessage({ type: "success", text: `Coupon "${trimmed.toUpperCase()}" applied!` });
    });
  }

  function handleRemove() {
    onCleared();
    setCode("");
    setMessage(null);
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <label className="mb-1.5 block text-sm font-medium text-gray-700">Coupon Code</label>
      {appliedCode ? (
        <div className="flex items-center justify-between rounded-md bg-brand-green/10 px-3 py-2 text-sm text-dark-green">
          <span>
            <strong>{appliedCode}</strong> applied
          </span>
          <button
            type="button"
            onClick={handleRemove}
            className="font-semibold text-sale-red hover:underline"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter code"
            className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-dark-green focus:outline-none focus:ring-1 focus:ring-dark-green"
          />
          <button
            type="button"
            onClick={handleApply}
            disabled={isPending || !code.trim()}
            className="shrink-0 rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Checking..." : "Apply"}
          </button>
        </div>
      )}
      {message && (
        <p
          className={`mt-2 text-xs ${message.type === "error" ? "text-red-600" : "text-brand-green"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
