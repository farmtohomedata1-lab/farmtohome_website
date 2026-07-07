"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { GalleryContent } from "@/content/homepage";
import { IconArrowRight } from "./icons";
import SectionHeading from "./SectionHeading";

const AUTO_ADVANCE_MS = 4000;
const RESUME_AFTER_MANUAL_MS = 6000;

// CMS-managed image carousel (admin can add/reorder/remove images the same
// way as every other admin-managed image list). Auto-advances on a timer;
// manual arrow clicks jump immediately and pause the timer briefly so a
// manual choice doesn't get instantly overridden by the next auto-tick.
export default function Gallery({ content }: { content: GalleryContent }) {
  const images = content.images;
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startAutoAdvance = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (images.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, AUTO_ADVANCE_MS);
  }, [images.length]);

  useEffect(() => {
    startAutoAdvance();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, [startAutoAdvance]);

  function handleManualNav(direction: 1 | -1) {
    setIndex((i) => (i + direction + images.length) % images.length);

    if (timerRef.current) clearInterval(timerRef.current);
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(startAutoAdvance, RESUME_AFTER_MANUAL_MS);
  }

  if (images.length === 0) return null;
  const current = images[index];

  return (
    <section id="gallery" className="mx-auto w-full max-w-[1320px] px-4 py-12 sm:px-6">
      {content.heading && <SectionHeading title={content.heading} />}
      <div className="relative mt-6 overflow-hidden rounded-lg bg-gray-section">
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
              width={1200}
              height={480}
              className="h-64 w-full object-cover sm:h-80 lg:h-[420px]"
            />
          </motion.div>
        </AnimatePresence>

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => handleManualNav(-1)}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-dark-green shadow-md hover:bg-white"
            >
              <IconArrowRight className="h-4 w-4 rotate-180" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => handleManualNav(1)}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-dark-green shadow-md hover:bg-white"
            >
              <IconArrowRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
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
    </section>
  );
}
