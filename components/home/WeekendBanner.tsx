"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { WeekendBannerContent } from "@/content/homepage";
import { fadeIn, viewportOnce } from "./motion";

export default function WeekendBanner({ content }: { content: WeekendBannerContent }) {
  return (
    <section className="mx-auto w-full max-w-[1320px] px-4 pb-10 sm:px-6">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fadeIn}
        className="grid items-center gap-6 overflow-hidden rounded-lg bg-banner-green px-6 py-8 sm:px-10 md:grid-cols-2"
      >
        <div>
          {content.label && (
            <p className="text-sm font-semibold text-gold">{content.label}</p>
          )}
          {content.heading && (
            <h2 className="mt-2 max-w-md text-2xl font-bold leading-snug text-white sm:text-3xl">
              {content.heading}
            </h2>
          )}
          {content.description && (
            <p className="mt-3 max-w-md text-sm leading-6 text-white/60">
              {content.description}
            </p>
          )}
        </div>
        {content.image && (
          <div className="flex items-center justify-center md:justify-end">
            <Image
              src={content.image}
              alt={content.imageAlt || ""}
              width={520}
              height={280}
              className="h-auto w-full max-w-md"
            />
          </div>
        )}
      </motion.div>
    </section>
  );
}
