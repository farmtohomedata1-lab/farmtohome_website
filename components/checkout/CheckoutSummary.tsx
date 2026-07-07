import { formatPrice } from "@/lib/format";
import type { CartTotals } from "@/lib/cartTotals";

export default function CheckoutSummary({
  totals,
  appliedCode,
  isPlacing,
  error,
  onPlaceOrder,
}: {
  totals: CartTotals;
  appliedCode: string | null;
  isPlacing: boolean;
  error: string | null;
  onPlaceOrder: () => void;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-dark-green">
        Order Summary
      </h2>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">Subtotal</dt>
          <dd className="font-medium text-gray-900">{formatPrice(totals.subtotal)}</dd>
        </div>
        {appliedCode && totals.discount > 0 && (
          <div className="flex justify-between">
            <dt className="text-gray-500">Discount ({appliedCode})</dt>
            <dd className="font-medium text-brand-green">-{formatPrice(totals.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-100 pt-2">
          <dt className="text-gray-500">Delivery Fee</dt>
          <dd className="font-medium text-gray-900">
            {totals.shippingFee === 0 ? "Free" : formatPrice(totals.shippingFee)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-2 text-base">
          <dt className="font-bold text-dark-green">Total</dt>
          <dd className="font-bold text-dark-green">{formatPrice(totals.total)}</dd>
        </div>
      </dl>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={onPlaceOrder}
        disabled={isPlacing}
        className="mt-4 w-full rounded-md bg-brand-green py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPlacing ? "Placing Order..." : "Place Order"}
      </button>
    </div>
  );
}
