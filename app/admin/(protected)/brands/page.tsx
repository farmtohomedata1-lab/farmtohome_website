import { prisma } from "@/lib/prisma";
import BrandsClient from "./BrandsClient";

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Brands</h1>
      <p className="mt-1 text-sm text-gray-500">
        Manage the brands customers can filter by on the Shop page.
      </p>

      <BrandsClient
        initialBrands={brands.map((b) => ({
          id: b.id,
          name: b.name,
          productCount: b._count.products,
        }))}
      />
    </div>
  );
}
