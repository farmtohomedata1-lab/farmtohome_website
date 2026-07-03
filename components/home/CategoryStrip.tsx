"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Category } from "@/content/homepage";
import { fadeUp, stagger, viewportOnce } from "./motion";

export default function CategoryStrip({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1320px] px-4 pt-8 sm:px-6">
      <motion.ul
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={stagger()}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8"
      >
        {categories.map((category) => (
          <motion.li key={category.id} variants={fadeUp}>
            <a
              href="#"
              className="flex flex-col items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-5 transition-colors hover:border-brand-green"
            >
              {category.image && (
                <Image
                  src={category.image}
                  alt={category.name || ""}
                  width={56}
                  height={56}
                  unoptimized
                  className="h-14 w-14"
                />
              )}
              {category.name && (
                <span className="text-center text-[13px] font-semibold text-dark-green">
                  {category.name}
                </span>
              )}
              {category.items && (
                <span className="text-[11px] font-medium text-brand-green">
                  {category.items}
                </span>
              )}
            </a>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
