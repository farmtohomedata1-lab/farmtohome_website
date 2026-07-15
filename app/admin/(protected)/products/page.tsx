import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { productTags } from "@/lib/cms/sections.config";
import ProductsClient from "./ProductsClient";

// Bounded so this page's Server Action responses (which re-render this same
// route after every product create/edit/delete/tag-toggle, per Next.js's
// own Server Action + RSC re-render behavior) never have to serialize the
// entire catalog on every single admin action. With hundreds of products
// (and growing via the real catalog import), an unbounded `findMany()` here
// meant every action's response payload grew with the catalog forever —
// exactly the kind of unbounded-per-action cost that's fine on a local dev
// server with no platform resource limits, but is a genuine, real risk on
// Vercel's actual serverless/production environment. 50 keeps each page's
// response small and roughly constant regardless of total catalog size.
const PAGE_SIZE = 50;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; page?: string; q?: string; bundle?: string }>;
}) {
  const { tag, page: pageParam, q, bundle } = await searchParams;
  const activeTag = tag && productTags.some((t) => t.value === tag) ? tag : undefined;
  const query = q?.trim() || undefined;
  const bundleOnly = bundle === "1";
  const pageRaw = pageParam ? parseInt(pageParam, 10) : 1;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const conditions: Prisma.ProductWhereInput[] = [];
  if (activeTag) conditions.push({ featuredTags: { has: activeTag } });
  if (bundleOnly) conditions.push({ isBundle: true });
  if (query) {
    conditions.push({
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { category: { name: { contains: query, mode: "insensitive" } } },
        { brand: { name: { contains: query, mode: "insensitive" } } },
      ],
    });
  }
  const where: Prisma.ProductWhereInput | undefined =
    conditions.length > 0 ? { AND: conditions } : undefined;

  // totalCount must be known before computing skip/take for `products` — a
  // stale `page` param from before a search/filter narrowed the result set
  // (e.g. a bookmarked URL, or the browser back button) must clamp to the
  // real last page, not skip past the end and silently return zero rows
  // while the pagination UI claims a smaller, valid page number.
  const [totalCount, categories, brands] = await Promise.all([
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  // A secondary, unique sort key is required for stable pagination: with
  // hundreds of rows sharing the exact same `createdAt` (a one-time bulk
  // import), `ORDER BY createdAt DESC` alone has no defined order among
  // those ties, and Postgres does not guarantee that tie order stays
  // consistent across separate queries/connections. Confirmed live: the
  // exact same skip/take query, run twice, returned overlapping rows across
  // page boundaries — real duplicate products across pages, not a
  // theoretical risk. `id` (unique) makes the ordering fully deterministic.
  const products = await prisma.product.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Products</h1>
      <p className="mt-1 text-sm text-gray-500">
        Tag products to control which homepage sections they appear in. Showing{" "}
        {products.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
        {(currentPage - 1) * PAGE_SIZE + products.length} of {totalCount}
        {bundleOnly && <> bundle deals</>}
        {query && <> matching “{query}”</>}.
      </p>

      <ProductsClient
        // Remounts (instead of re-rendering in place) whenever page/tag/query
        // changes. Without this, ProductsClient's `useState(initialProducts)`
        // only reads its initial-value argument on the very first mount — a
        // Server Action-driven re-render with a new `initialProducts` prop
        // does NOT re-run that initializer, so the old page's products stay
        // stuck in state while `currentPage`/`totalPages` (read straight from
        // props, not state) update correctly. That mismatch — page number
        // advances, list doesn't — was the actual pagination bug. A key tied
        // to every input that changes the query forces a clean remount so
        // the new `initialProducts` genuinely takes effect.
        key={`${currentPage}-${activeTag ?? ""}-${query ?? ""}-${bundleOnly ? "b" : ""}`}
        initialProducts={products.map((p) => ({
          id: p.id,
          name: p.name,
          pack: p.pack ?? "",
          price: p.price.toNumber(),
          compareAtPrice: p.compareAtPrice ? p.compareAtPrice.toNumber() : null,
          discountActive: p.discountActive,
          inStock: p.inStock,
          rating: p.rating,
          image: p.image ?? "",
          featuredTags: p.featuredTags,
          categoryId: p.categoryId ?? "",
          brandId: p.brandId ?? "",
          detailedDescription: p.detailedDescription ?? "",
          chargeShipping: p.chargeShipping,
          taxable: p.taxable,
          taxOverridePercent: p.taxOverridePercent ? p.taxOverridePercent.toNumber() : null,
          isBundle: p.isBundle,
        }))}
        availableTags={productTags}
        activeTag={activeTag}
        initialQuery={query ?? ""}
        bundleOnly={bundleOnly}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
}
