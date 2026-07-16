import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";
import { SORT_OPTIONS, type ParsedShopFilters, type SortOption } from "./constants";

export interface ShopSearchParams {
  category?: string | string[];
  brand?: string | string[];
  minPrice?: string;
  maxPrice?: string;
  status?: string | string[];
  sort?: string;
  page?: string;
  q?: string;
  tag?: string;
}

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function parseShopFilters(params: ShopSearchParams): ParsedShopFilters {
  const categoryIds = toArray(params.category);
  const brandIds = toArray(params.brand);
  const statuses = toArray(params.status);

  const minPriceRaw = params.minPrice != null ? Number(params.minPrice) : NaN;
  const maxPriceRaw = params.maxPrice != null ? Number(params.maxPrice) : NaN;
  let minPrice = Number.isFinite(minPriceRaw) ? minPriceRaw : null;
  let maxPrice = Number.isFinite(maxPriceRaw) ? maxPriceRaw : null;
  if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  const sort = (SORT_OPTIONS as string[]).includes(params.sort ?? "")
    ? (params.sort as SortOption)
    : "latest";

  const pageRaw = params.page ? parseInt(params.page, 10) : 1;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const search = params.q?.trim() || null;
  const tag = params.tag?.trim() || null;

  return {
    categoryIds,
    brandIds,
    minPrice,
    maxPrice,
    inStockOnly: statuses.includes("in-stock"),
    onSaleOnly: statuses.includes("on-sale"),
    bundleOnly: statuses.includes("bundle"),
    sort,
    page,
    search,
    tag,
  };
}

// Category/brand are OR-within-group (matches any selected id), AND across
// groups; the two status checkboxes AND together since In Stock and On Sale
// are independent product attributes, not alternatives.
export function buildProductWhere(filters: ParsedShopFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};
  if (filters.categoryIds.length) where.categoryId = { in: filters.categoryIds };
  if (filters.brandIds.length) where.brandId = { in: filters.brandIds };
  if (filters.minPrice != null || filters.maxPrice != null) {
    where.price = {
      ...(filters.minPrice != null ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice != null ? { lte: filters.maxPrice } : {}),
    };
  }
  if (filters.inStockOnly) where.inStock = true;
  if (filters.onSaleOnly) where.isOnSale = true;
  if (filters.bundleOnly) where.isBundle = true;
  if (filters.tag) where.featuredTags = { has: filters.tag };
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { detailedDescription: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  return where;
}

export function buildProductOrderBy(sort: SortOption): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "price-asc":
      return { price: "asc" };
    case "price-desc":
      return { price: "desc" };
    case "name-asc":
      return { name: "asc" };
    case "latest":
    default:
      return { createdAt: "desc" };
  }
}
