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

  const products = await prisma.product.findMany({
    where: activeTag ? { featuredTags: { has: activeTag } } : undefined,
    orderBy: { createdAt: "desc" },
  });

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
          price: p.price,
          oldPrice: p.oldPrice ?? "",
          rating: p.rating,
          image: p.image ?? "",
          featuredTags: p.featuredTags,
        }))}
        availableTags={productTags}
        activeTag={activeTag}
      />
    </div>
  );
}
