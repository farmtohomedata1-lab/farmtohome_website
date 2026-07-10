import { prisma } from "@/lib/prisma";
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
  searchParams: Promise<{ tag?: string; page?: string }>;
}) {
  const { tag, page: pageParam } = await searchParams;
  const activeTag = tag && productTags.some((t) => t.value === tag) ? tag : undefined;
  const pageRaw = pageParam ? parseInt(pageParam, 10) : 1;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const where = activeTag ? { featuredTags: { has: activeTag } } : undefined;

  const [totalCount, products, categories, brands] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Products</h1>
      <p className="mt-1 text-sm text-gray-500">
        Tag products to control which homepage sections they appear in. Showing{" "}
        {products.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
        {(currentPage - 1) * PAGE_SIZE + products.length} of {totalCount}.
      </p>

      <ProductsClient
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
        }))}
        availableTags={productTags}
        activeTag={activeTag}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
}
