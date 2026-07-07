import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { CartTotals } from "@/lib/cartTotals";

export default function CartSummary({
  totals,
  appliedCode,
}: {
  totals: CartTotals;
  appliedCode: string | null;
}) {
  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-dark-green">
        Cart Totals
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
        {totals.taxAmount > 0 && (
          <div className="flex justify-between">
            <dt className="text-gray-500">Tax</dt>
            <dd className="font-medium text-gray-900">{formatPrice(totals.taxAmount)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-200 pt-2 text-base">
          <dt className="font-bold text-dark-green">Total</dt>
          <dd className="font-bold text-dark-green">{formatPrice(totals.total)}</dd>
        </div>
      </dl>

      {/* /checkout itself is login-gated (proxy.ts + requireAuthedCustomer) —
          an unauthenticated click lands on /login?redirect=/checkout and
          comes straight back here once verified, so no client-side auth
          check is needed on this button. */}
      <Link
        href="/checkout"
        className="mt-4 block w-full rounded-md bg-brand-green py-3 text-center text-sm font-semibold text-white"
      >
        Proceed to Checkout
      </Link>
    </div>
  );
}
