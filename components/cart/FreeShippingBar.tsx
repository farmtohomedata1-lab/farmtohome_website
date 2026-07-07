import { formatPrice } from "@/lib/format";

export default function FreeShippingBar({
  subtotal,
  threshold,
  shippingFee,
}: {
  subtotal: number;
  threshold: number;
  // The real, authoritative shipping fee from computeCartTotals — used for
  // "unlocked", instead of recomputing that independently from subtotal vs.
  // threshold, so this can never drift from the actual charge. In
  // particular, shipping can be $0 because every item in the cart is
  // shipping-exempt even while subtotal is still under threshold — this bar
  // must say "unlocked" in that case too, not show a misleading "spend $X
  // more" message for a fee that was never going to be charged.
  shippingFee: number;
}) {
  const remaining = Math.max(0, threshold - subtotal);
  const percent = threshold > 0 ? Math.min(100, (subtotal / threshold) * 100) : 100;
  const unlocked = shippingFee === 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm font-medium text-dark-green">
        {unlocked
          ? "You've unlocked free shipping!"
          : `Add ${formatPrice(remaining)} more for free shipping`}
      </p>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-brand-green transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
