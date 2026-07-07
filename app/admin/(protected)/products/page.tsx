import { prisma } from "@/lib/prisma";
import { productTags } from "@/lib/cms/sections.config";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const activeTag = tag && productTags.some((t) => t.value === tag) ? tag : undefined;

  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where: activeTag ? { featuredTags: { has: activeTag } } : undefined,
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Products</h1>
      <p className="mt-1 text-sm text-gray-500">
        Tag products to control which homepage sections they appear in.
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
      />
    </div>
  );
}
