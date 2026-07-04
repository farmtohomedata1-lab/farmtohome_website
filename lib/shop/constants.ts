// Client-safe shop constants — no server-only imports, so client filter/sort
// components can share these without pulling in Prisma types.

export const PAGE_SIZE = 20;

export type SortOption = "latest" | "price-asc" | "price-desc" | "name-asc";

export const SORT_OPTIONS: SortOption[] = ["latest", "price-asc", "price-desc", "name-asc"];

export const SORT_LABELS: Record<SortOption, string> = {
  latest: "Latest",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  "name-asc": "Name: A-Z",
};

// Human-readable labels for the same featuredTags values used to populate
// homepage sections — shown in the "Showing products from: X" banner when a
// homepage "See More" link lands on /shop pre-filtered by tag.
export const FEATURED_TAG_LABELS: Record<string, string> = {
  weekly_best_seller: "Weekly Best Seller",
  deals_of_the_day: "Deals of the Day",
  recently_added: "Recently Added",
  top_selling: "Top Selling",
  top_rated: "Top Rated",
};

export interface ParsedShopFilters {
  categoryIds: string[];
  brandIds: string[];
  minPrice: number | null;
  maxPrice: number | null;
  inStockOnly: boolean;
  onSaleOnly: boolean;
  sort: SortOption;
  page: number;
  search: string | null;
  tag: string | null;
}
