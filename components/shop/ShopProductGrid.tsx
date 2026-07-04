import Link from "next/link";
import ShopProductCard, { type ShopProduct } from "./ShopProductCard";

export default function ShopProductGrid({
  products,
  searchTerm,
  clearSearchHref,
}: {
  products: ShopProduct[];
  searchTerm: string | null;
  clearSearchHref: string;
}) {
  if (products.length === 0) {
    if (searchTerm) {
      return (
        <div className="rounded-lg border border-dashed border-gray-300 px-4 py-16 text-center text-sm text-gray-500">
          <p>
            No products found for &ldquo;{searchTerm}&rdquo;.
          </p>
          <Link
            href={clearSearchHref}
            className="mt-2 inline-block font-semibold text-dark-green underline"
          >
            Clear search
          </Link>
        </div>
      );
    }
    return (
      <div className="rounded-lg border border-dashed border-gray-300 px-4 py-16 text-center text-sm text-gray-500">
        No products match your filters. Try adjusting or resetting them.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ShopProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
