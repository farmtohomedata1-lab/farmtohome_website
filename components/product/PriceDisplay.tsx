import { formatPrice } from "@/lib/format";

const PRICE_SIZE_CLASSES = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-2xl",
} as const;

const COMPARE_SIZE_CLASSES = {
  sm: "text-[11px]",
  base: "text-xs",
  lg: "text-base",
} as const;

// The one place a product's current price is styled — every surface that
// shows a price (shop grid, homepage cards, product detail) renders it
// through here, so a color/style change only ever needs to happen once.
export default function PriceDisplay({
  price,
  compareAtPrice,
  size = "base",
}: {
  price: number;
  compareAtPrice?: number | null;
  size?: "sm" | "base" | "lg";
}) {
  return (
    <>
      <span className={`font-bold text-brand-green ${PRICE_SIZE_CLASSES[size]}`}>
        {formatPrice(price)}
      </span>
      {compareAtPrice != null && (
        <span className={`text-gray-400 line-through ${COMPARE_SIZE_CLASSES[size]}`}>
          {formatPrice(compareAtPrice)}
        </span>
      )}
    </>
  );
}
