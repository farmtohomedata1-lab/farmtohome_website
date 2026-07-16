"use client";

import { motion } from "framer-motion";
import type { FeaturedProduct } from "@/lib/cms/getSectionContent";
import { stagger, viewportOnce } from "./motion";
import ProductCard from "./ProductCard";
import SectionHeading from "./SectionHeading";

export default function DealsOfTheDay({
  heading,
  products,
}: {
  heading?: string;
  products: FeaturedProduct[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1320px] px-4 py-10 sm:px-6">
      {heading && <SectionHeading title={heading} withDot />}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={stagger()}
        className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </motion.div>
    </section>
  );
}
