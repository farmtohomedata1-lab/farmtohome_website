// Shared display formatting — single source of truth so every product price
// on the site (homepage sections, admin lists, /shop) renders identically.

export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
