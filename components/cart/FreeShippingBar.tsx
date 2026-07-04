import { formatPrice } from "@/lib/format";

export default function FreeShippingBar({
  subtotal,
  threshold,
}: {
  subtotal: number;
  threshold: number;
}) {
  const remaining = Math.max(0, threshold - subtotal);
  const percent = threshold > 0 ? Math.min(100, (subtotal / threshold) * 100) : 100;
  const unlocked = remaining <= 0;

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
