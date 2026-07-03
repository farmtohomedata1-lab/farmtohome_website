"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { productCardLabels } from "@/content/homepage";
import { buttonMotion, cardLift, fadeUp } from "./motion";
import { IconCart, IconStar } from "./icons";

export interface ProductCardProduct {
  id: string;
  name: string;
  pack?: string | null;
  price: string;
  oldPrice?: string | null;
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
  return (
    <motion.article
      variants={fadeUp}
      whileHover={cardLift}
      className="relative flex flex-col rounded-md border border-gray-200 bg-white p-4"
    >
      <span className="absolute left-3 top-3 z-10 rounded-sm bg-brand-green px-2 py-1 text-[10px] font-bold uppercase text-white">
        {productCardLabels.saleTag}
      </span>
      <div className="flex h-32 items-center justify-center py-2">
        {product.image && (
          <Image
            src={product.image}
            alt={product.name || ""}
            width={120}
            height={120}
            unoptimized
            className="h-28 w-28"
          />
        )}
      </div>
      <StarRating rating={product.rating} />
      {product.name && (
        <h3 className="mt-2 text-[13px] font-semibold leading-snug text-dark-green">
          {product.name}
        </h3>
      )}
      {product.pack && <p className="mt-1 text-xs text-gray-400">{product.pack}</p>}
      <p className="mt-2 flex items-baseline gap-2">
        {product.price && (
          <span className="text-base font-bold text-sale-red">{product.price}</span>
        )}
        {product.oldPrice && (
          <span className="text-xs text-gray-400 line-through">{product.oldPrice}</span>
        )}
      </p>
      <motion.button
        {...buttonMotion}
        type="button"
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-brand-green py-2.5 text-xs font-semibold text-white"
      >
        {productCardLabels.addToCart}
        <IconCart className="h-3.5 w-3.5" />
      </motion.button>
    </motion.article>
  );
}
