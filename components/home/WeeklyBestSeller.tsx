"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { FeaturedProduct } from "@/lib/cms/getSectionContent";
import { formatPrice } from "@/lib/format";
import { cardLift, fadeUp, stagger, viewportOnce } from "./motion";
import SectionHeading from "./SectionHeading";

export default function WeeklyBestSeller({
  heading,
  products,
}: {
  heading?: string;
  products: FeaturedProduct[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="mt-10 bg-gray-section py-10">
      <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {heading && <SectionHeading title={heading} withDot />}
          <Link
            href="/shop"
            className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.03] active:scale-95"
          >
            Shop All Productss
          </Link>
        </div>
        <motion.ul
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={stagger()}
          className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
        >
          {products.map((product) => (
            <motion.li
              key={product.id}
              variants={fadeUp}
              whileHover={cardLift}
              className="flex flex-col items-center rounded-md border border-gray-200 bg-white px-4 py-6"
            >
              <Link href={`/product/${product.id}`} className="flex flex-col items-center">
                {product.image && (
                  <Image
                    src={product.image}
                    alt={product.name || ""}
                    width={96}
                    height={96}
                    className="h-24 w-24"
                  />
                )}
                {product.name && (
                  <h3 className="mt-4 text-center text-[13px] font-semibold text-dark-green hover:underline">
                    {product.name}
                  </h3>
                )}
              </Link>
              <p className="mt-1 text-xs font-semibold text-brand-green">
                {formatPrice(product.price)}
              </p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
