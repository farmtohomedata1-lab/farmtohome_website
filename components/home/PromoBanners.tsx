"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { PromoBanner } from "@/content/homepage";
import { fadeIn, viewportOnce } from "./motion";

export default function PromoBanners({ banners }: { banners: PromoBanner[] }) {
  if (banners.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1320px] px-4 pt-8 sm:px-6">
      <div className="grid gap-4 md:grid-cols-2">
        {banners.map((banner) => (
          <motion.div
            key={banner.id}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={fadeIn}
            className="relative flex items-center justify-between gap-4 overflow-hidden rounded-lg bg-cream px-6 py-8 sm:px-10"
          >
            <div
              aria-hidden="true"
              className="absolute -left-10 top-0 h-full w-2/3 rounded-r-[50%] bg-white/40"
            />
            <div className="relative">
              {(banner.headingLine1 || banner.headingLine2) && (
                <h3 className="text-lg font-bold leading-snug text-dark-green sm:text-xl">
                  {banner.headingLine1}
                  {banner.headingLine1 && banner.headingLine2 && <br />}
                  {banner.headingLine2}
                </h3>
              )}
              {banner.priceLabel && (
                <p className="mt-3 text-xs text-gray-500">{banner.priceLabel}</p>
              )}
              {banner.price && (
                <p className="mt-1 text-2xl font-bold text-brand-green">
                  {banner.price}
                </p>
              )}
            </div>
            {banner.image && (
              <Image
                src={banner.image}
                alt={banner.imageAlt || ""}
                width={200}
                height={160}
                unoptimized
                className="relative h-32 w-auto sm:h-36"
              />
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
