"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { HeroContent } from "@/content/homepage";
import {
  buttonMotion,
  slideFromLeft,
  slideFromRight,
  stagger,
} from "./motion";
import { IconArrowRight } from "./icons";
import HeroCarousel from "./HeroCarousel";

export default function Hero({ content }: { content: HeroContent }) {
  // Anything but "carousel" (including absent, on every hero row that
  // existed before this feature) means static — and "carousel" with zero
  // images uploaded also falls back to static rather than an empty image
  // slot, per the graceful-degradation requirement.
  const carouselImages = content.carouselImages ?? [];
  const useCarouselMode = content.heroStyle === "carousel" && carouselImages.length > 0;

  return (
    <section className="mx-auto w-full max-w-[1320px] px-4 pt-6 sm:px-6">
      <div className="grid overflow-hidden rounded-lg bg-cream lg:grid-cols-2">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger(0.15)}
          className="flex flex-col items-start justify-center gap-5 px-6 py-10 sm:px-10 lg:py-16 lg:pl-14"
        >
          {content.eyebrow && (
            <motion.p
              variants={slideFromLeft}
              className="text-sm font-semibold text-dark-green"
            >
              {content.eyebrow}
            </motion.p>
          )}
          {content.heading && (
            <motion.h1
              variants={slideFromLeft}
              className="max-w-md text-3xl font-bold leading-tight text-dark-green sm:text-4xl lg:text-[42px]"
            >
              {content.heading}
            </motion.h1>
          )}
          {content.description && (
            <motion.p
              variants={slideFromLeft}
              className="max-w-md text-sm leading-6 text-gray-500"
            >
              {content.description}
            </motion.p>
          )}
          <motion.div
            variants={slideFromLeft}
            className="mt-2 flex items-center gap-5"
          >
            {content.cta && (
              <motion.a
                {...buttonMotion}
                href="/shop"
                className="flex items-center gap-2 rounded-md bg-brand-green px-6 py-3 text-sm font-semibold text-white"
              >
                {content.cta}
                <IconArrowRight className="h-4 w-4" />
              </motion.a>
            )}
            {content.price && (
              <p className="flex items-baseline gap-2">
                {content.priceLabel && (
                  <span className="text-xs text-gray-500">{content.priceLabel}</span>
                )}
                <span className="text-3xl font-bold text-dark-green">
                  {content.price}
                </span>
              </p>
            )}
          </motion.div>
        </motion.div>

        {useCarouselMode ? (
          <HeroCarousel images={carouselImages} />
        ) : (
          content.image && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={slideFromRight}
              transition={{ delay: 0.15 }}
              className="flex items-center justify-center px-6 pb-8 lg:p-0"
            >
              <Image
                src={content.image}
                alt={content.imageAlt || ""}
                width={640}
                height={440}
                priority
                className="h-auto w-full max-w-xl"
              />
            </motion.div>
          )
        )}
      </div>
    </section>
  );
}
