// Single source of truth for the "on sale" business rule, so the admin
// write actions (which populate the stored Product.isOnSale column) and the
// storefront (which renders the discount badge) can never disagree.
//
// A product is on sale only when discountActive is true AND compareAtPrice
// is set AND it's actually greater than price. discountActive is a separate
// admin toggle so compareAtPrice can be kept on file and re-enabled later
// without retyping it.

export function computeIsOnSale({
  price,
  compareAtPrice,
  discountActive,
}: {
  price: number;
  compareAtPrice: number | null;
  discountActive: boolean;
}): boolean {
  return discountActive && compareAtPrice != null && compareAtPrice > price;
}

export function computeDiscountPercent(price: number, compareAtPrice: number): number {
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}
