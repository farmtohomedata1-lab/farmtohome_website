"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { productCardLabels } from "@/content/homepage";
import { computeDiscountPercent } from "@/lib/pricing";
import { useWishlistStore } from "@/lib/wishlistStore";
import { cardLift, fadeUp } from "./motion";
import { IconHeart, IconStar } from "./icons";
import CartQuantityControl from "@/components/product/CartQuantityControl";
import PriceDisplay from "@/components/product/PriceDisplay";

export interface ProductCardProduct {
  id: string;
  name: string;
  pack?: string | null;
  price: number;
  compareAtPrice?: number | null;
  isOnSale: boolean;
  inStock: boolean;
  rating: number;
  image?: string | null;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`Rated ${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <IconStar
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "text-gold" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

// Deal-style card: ON SALE tag, image, stars, name, pack, prices, Add To Cart.
// Inherits the parent's stagger via the fadeUp variant.
export default function ProductCard({ product }: { product: ProductCardProduct }) {
  const isWishlisted = useWishlistStore((state) => state.items.some((i) => i.id === product.id));
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const discountPercent =
    product.isOnSale && product.compareAtPrice != null
      ? computeDiscountPercent(product.price, product.compareAtPrice)
      : null;

  return (
    <motion.article
      variants={fadeUp}
      whileHover={cardLift}
      className="relative flex flex-col rounded-md border border-gray-200 bg-white p-4"
    >
      {discountPercent != null && discountPercent > 0 && (
        <span className="absolute left-3 top-3 z-10 rounded-sm bg-brand-green px-2 py-1 text-[10px] font-bold uppercase text-white">
          {productCardLabels.saleTag}
        </span>
      )}
      <button
        type="button"
        onClick={() =>
          toggleWishlist({
            id: product.id,
            name: product.name,
            pack: product.pack ?? null,
            price: product.price,
            compareAtPrice: product.compareAtPrice ?? null,
            isOnSale: product.isOnSale,
            inStock: true,
            image: product.image ?? null,
          })
        }
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={isWishlisted}
        className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm"
      >
        <IconHeart
          className={`h-3.5 w-3.5 ${isWishlisted ? "fill-sale-red text-sale-red" : "text-gray-400"}`}
        />
      </button>
      <Link href={`/product/${product.id}`} className="flex h-32 items-center justify-center py-2">
        {product.image && (
          <Image
            src={product.image}
            alt={product.name || ""}
            width={120}
            height={120}
            className="h-28 w-28"
          />
        )}
      </Link>
      <StarRating rating={product.rating} />
      {product.name && (
        <Link href={`/product/${product.id}`}>
          <h3 className="mt-2 text-[13px] font-semibold leading-snug text-dark-green hover:underline">
            {product.name}
          </h3>
        </Link>
      )}
      {product.pack && <p className="mt-1 text-xs text-gray-400">{product.pack}</p>}
      <p className="mt-2 flex items-baseline gap-2">
        <PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} />
      </p>
      <div className="mt-3">
        <CartQuantityControl
          product={{
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image ?? null,
            pack: product.pack ?? null,
            inStock: product.inStock,
          }}
          variant="card"
          addLabel={productCardLabels.addToCart}
          showCartIcon
        />
      </div>
    </motion.article>
  );
}
