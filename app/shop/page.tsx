import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import TopBar from "@/components/home/TopBar";
import SiteHeader from "@/components/home/SiteHeader";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";
import PageHero from "@/components/common/PageHero";
import ShopSidebar from "@/components/shop/ShopSidebar";
import ShopToolbar from "@/components/shop/ShopToolbar";
import ShopProductGrid from "@/components/shop/ShopProductGrid";
import Pagination from "@/components/shop/Pagination";
import { getSectionContent } from "@/lib/cms/getSectionContent";
import { prisma } from "@/lib/prisma";
import { FEATURED_TAG_LABELS, PAGE_SIZE } from "@/lib/shop/constants";
import {
  buildProductOrderBy,
  buildProductWhere,
  parseShopFilters,
  type ShopSearchParams,
} from "@/lib/shop/query";

export const metadata: Metadata = {
  title: "Shop All Products | Farm To Home",
  description:
    "Browse and filter our full range of fresh groceries, delivered across Singapore.",
};

interface ShopHeroContent {
  heading: string;
  breadcrumbLabel: string;
}

// Preserves every active filter/sort param except "q" (and resets "page",
// same as every other filter-changing action on this page) — used for the
// "Clear search" link in the empty state so an active search doesn't wipe
// out other filters the shopper already picked.
function hrefWithout(params: ShopSearchParams, dropKeys: string[]): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (dropKeys.includes(key)) continue;
    if (Array.isArray(value)) value.forEach((v) => usp.append(key, v));
    else if (value != null) usp.set(key, value);
  }
  const qs = usp.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

// Preserves every active filter/sort param except "q" (and resets "page",
// same as every other filter-changing action on this page) — used for the
// "Clear search" link in the empty state so an active search doesn't wipe
// out other filters the shopper already picked.
function clearSearchHref(params: ShopSearchParams): string {
  return hrefWithout(params, ["q", "page"]);
}

function clearTagHref(params: ShopSearchParams): string {
  return hrefWithout(params, ["tag", "page"]);
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  const rawParams = await searchParams;
  const filters = parseShopFilters(rawParams);
  const where = buildProductWhere(filters);

  const [hero, categories, brands, priceBounds, totalCount, products] = await Promise.all([
    getSectionContent<ShopHeroContent>("shop", "hero"),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.product.aggregate({ _min: { price: true }, _max: { price: true } }),
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: buildProductOrderBy(filters.sort),
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(filters.page, totalPages);
  const priceMin = priceBounds._min.price?.toNumber() ?? 0;
  const priceMax = priceBounds._max.price?.toNumber() ?? 0;

  return (
    <>
      <TopBar />
      <SiteHeader />
      <NavBar />
      <main>
        <PageHero
          heading={hero?.content.heading ?? "All Products"}
          breadcrumbLabel={hero?.content.breadcrumbLabel ?? "Shop"}
        />

        <div className="mx-auto w-full max-w-[1320px] px-4 pt-8 sm:px-6">
          {filters.tag && (
            <div className="mb-4 flex items-center justify-between rounded-md bg-brand-green/10 px-4 py-2.5 text-sm text-dark-green">
              <span>
                Showing products from{" "}
                <strong>{FEATURED_TAG_LABELS[filters.tag] ?? filters.tag}</strong>
              </span>
              <Link href={clearTagHref(rawParams)} className="font-semibold underline">
                Clear filter
              </Link>
            </div>
          )}
        </div>

        <div className="mx-auto w-full max-w-[1320px] px-4 pb-8 sm:px-6 lg:flex lg:items-start lg:gap-8">
          <Suspense fallback={null}>
            <ShopSidebar
              categories={categories.map((c) => ({ id: c.id, name: c.name }))}
              brands={brands.map((b) => ({ id: b.id, name: b.name }))}
              priceMin={priceMin}
              priceMax={priceMax}
              selectedCategoryIds={filters.categoryIds}
              selectedBrandIds={filters.brandIds}
              minPrice={filters.minPrice}
              maxPrice={filters.maxPrice}
              inStockOnly={filters.inStockOnly}
              onSaleOnly={filters.onSaleOnly}
            />
          </Suspense>

          <div className="mt-8 min-w-0 flex-1 lg:mt-0">
            <Suspense fallback={null}>
              <ShopToolbar
                totalCount={totalCount}
                page={currentPage}
                pageSize={PAGE_SIZE}
                sort={filters.sort}
                searchTerm={filters.search}
              />
            </Suspense>

            <ShopProductGrid
              products={products.map((p) => ({
                id: p.id,
                name: p.name,
                pack: p.pack,
                price: p.price.toNumber(),
                compareAtPrice: p.compareAtPrice ? p.compareAtPrice.toNumber() : null,
                isOnSale: p.isOnSale,
                inStock: p.inStock,
                image: p.image,
              }))}
              searchTerm={filters.search}
              clearSearchHref={clearSearchHref(rawParams)}
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              searchParams={rawParams}
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
