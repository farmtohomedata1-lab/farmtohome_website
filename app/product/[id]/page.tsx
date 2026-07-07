import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import SiteHeader from "@/components/home/SiteHeader";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";
import CartQuantityControl from "@/components/product/CartQuantityControl";
import PriceDisplay from "@/components/product/PriceDisplay";
import { prisma } from "@/lib/prisma";
import { computeDiscountPercent } from "@/lib/pricing";

// Wrapped in React's cache() so generateMetadata and the page body — which
// both need this same product — share one DB round trip per request instead
// of two; without this, every PDP view queried the database twice for
// identical data.
const getProduct = cache(async (id: string) => {
  return prisma.product.findUnique({
    where: { id },
    include: { category: true, brand: true },
  });
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  return {
    title: product ? `${product.name} | Farm To Home` : "Product | Farm To Home",
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const price = product.price.toNumber();
  const compareAtPrice = product.compareAtPrice ? product.compareAtPrice.toNumber() : null;
  const discountPercent =
    product.isOnSale && compareAtPrice != null
      ? computeDiscountPercent(price, compareAtPrice)
      : null;

  return (
    <>
      <SiteHeader />
      <NavBar />
      <main>
        <div className="mx-auto w-full max-w-[1320px] px-4 pt-6 sm:px-6">
          <p className="truncate text-sm text-gray-500">
            <Link href="/" className="text-gray-400 hover:text-brand-green">
              Home
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <Link href="/shop" className="text-gray-400 hover:text-brand-green">
              Shop
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <span className="font-medium text-brand-green">{product.name}</span>
          </p>
        </div>

        <div className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:flex lg:items-start lg:gap-10">
          <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-8 lg:w-[420px] lg:shrink-0">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                width={320}
                height={320}
                className="h-64 w-64 object-contain sm:h-80 sm:w-80"
              />
            ) : (
              <div className="flex h-64 w-64 items-center justify-center text-sm text-gray-400 sm:h-80 sm:w-80">
                No image available
              </div>
            )}
          </div>

          <div className="mt-6 min-w-0 flex-1 lg:mt-0">
            <div className="flex flex-wrap gap-2">
              {product.category && (
                <span className="rounded-full bg-brand-green/10 px-3 py-1 text-xs font-semibold text-dark-green">
                  {product.category.name}
                </span>
              )}
              {product.brand && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                  {product.brand.name}
                </span>
              )}
              {!product.inStock && (
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                  Out of Stock
                </span>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-bold text-dark-green sm:text-3xl">
              {product.name}
            </h1>
            {product.pack && <p className="mt-1 text-sm text-gray-400">{product.pack}</p>}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <PriceDisplay price={price} compareAtPrice={compareAtPrice} size="lg" />
              {discountPercent != null && discountPercent > 0 && (
                <span className="rounded-sm bg-brand-green px-2 py-1 text-xs font-bold uppercase text-white">
                  {discountPercent}% Off
                </span>
              )}
            </div>

            <div className="mt-6">
              <CartQuantityControl
                product={{
                  id: product.id,
                  name: product.name,
                  price,
                  image: product.image,
                  pack: product.pack,
                  inStock: product.inStock,
                }}
                variant="detail"
              />
            </div>

            {product.detailedDescription && (
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h2 className="text-lg font-bold text-dark-green">Product Details</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                  {product.detailedDescription}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
