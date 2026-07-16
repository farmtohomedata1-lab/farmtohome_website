import { formatPrice } from "@/lib/format";

const PRICE_SIZE_CLASSES = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-2xl",
  // Homepage product cards only (components/home/ProductCard.tsx) — client-
  // requested larger price text there, distinct from "lg" (already used by
  // the product detail page) so that change doesn't also affect the PDP.
  cardLarge: "text-lg",
} as const;

const COMPARE_SIZE_CLASSES = {
  sm: "text-[11px]",
  base: "text-xs",
  lg: "text-base",
  cardLarge: "text-sm",
} as const;

// Client-requested Dark Green (#2c3c28) for the homepage card price,
// distinct from the brand-green (#629d23) every other price surface (shop
// grid, cart, PDP) keeps using — scoped via the size variant below rather
// than a separate prop, so this stays the one shared place price color is
// decided, per size, instead of a one-off override at a single call site.
const PRICE_COLOR_CLASSES = {
  sm: "text-brand-green",
  base: "text-brand-green",
  lg: "text-brand-green",
  cardLarge: "text-dark-green",
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
  size?: "sm" | "base" | "lg" | "cardLarge";
}) {
  return (
    <>
      <span className={`font-bold ${PRICE_COLOR_CLASSES[size]} ${PRICE_SIZE_CLASSES[size]}`}>
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
