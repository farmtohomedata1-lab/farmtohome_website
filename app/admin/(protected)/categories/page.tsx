import { prisma } from "@/lib/prisma";
import CategoriesClient from "./CategoriesClient";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Categories</h1>
      <p className="mt-1 text-sm text-gray-500">
        Manage the categories customers can filter by on the Shop page.
      </p>

      <CategoriesClient
        initialCategories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          productCount: c._count.products,
        }))}
      />
    </div>
  );
}
