"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { HeroCarouselImage } from "@/content/homepage";
import { useCarousel } from "@/lib/useCarousel";
import { slideFromRight } from "./motion";
import { IconArrowRight } from "./icons";

// Same auto-advance/manual-nav behavior as components/home/Gallery.tsx (via
// the shared lib/useCarousel.ts hook), sized and positioned to drop into
// Hero's image slot without shifting layout when switching Static/Carousel.
export default function HeroCarousel({ images }: { images: HeroCarouselImage[] }) {
  const { index, handleManualNav } = useCarousel(images.length);
  const current = images[index];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideFromRight}
      transition={{ delay: 0.15 }}
      className="relative flex items-center justify-center px-6 pb-8 lg:p-0"
    >
      <div className="relative w-full max-w-xl overflow-hidden rounded-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Image
              src={current.image}
              alt={current.imageAlt || ""}
              width={640}
              height={440}
              priority
              className="h-auto w-full"
            />
          </motion.div>
        </AnimatePresence>

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => handleManualNav(-1)}
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-dark-green shadow-md hover:bg-white"
            >
              <IconArrowRight className="h-3.5 w-3.5 rotate-180" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => handleManualNav(1)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-dark-green shadow-md hover:bg-white"
            >
              <IconArrowRight className="h-3.5 w-3.5" />
            </button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((image, i) => (
                <span
                  key={image.id}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    i === index ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
