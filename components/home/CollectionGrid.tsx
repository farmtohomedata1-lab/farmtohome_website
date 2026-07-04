"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { FeaturedProduct } from "@/lib/cms/getSectionContent";
import { buttonMotion, fadeUp, stagger, viewportOnce } from "./motion";
import ProductCard from "./ProductCard";

const MotionLink = motion.create(Link);

export interface CollectionPanel {
  key: string;
  heading?: string;
  seeMoreLabel?: string;
  products: FeaturedProduct[];
}

export default function CollectionGrid({ panels }: { panels: CollectionPanel[] }) {
  const visiblePanels = panels.filter((panel) => panel.products.length > 0);
  if (visiblePanels.length === 0) return null;

  return (
    <section className="bg-gray-section py-10">
      <div className="mx-auto grid w-full max-w-[1320px] gap-6 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-3">
        {visiblePanels.map((panel) => (
          <motion.div
            key={panel.key}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={stagger()}
            className="rounded-lg bg-white p-5 sm:p-6"
          >
            <motion.div variants={fadeUp} className="flex items-center justify-between">
              {panel.heading && (
                <h2 className="text-lg font-bold text-dark-green">{panel.heading}</h2>
              )}
              {panel.seeMoreLabel && (
                <MotionLink
                  {...buttonMotion}
                  href={`/shop?tag=${panel.key}`}
                  className="rounded-md bg-brand-green px-4 py-2 text-xs font-semibold text-white"
                >
                  {panel.seeMoreLabel}
                </MotionLink>
              )}
            </motion.div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {panel.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
