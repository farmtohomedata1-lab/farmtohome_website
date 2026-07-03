"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { DestinationContent } from "@/content/about";
import { fadeUp, stagger, viewportOnce } from "@/components/home/motion";

export default function DestinationSection({ content }: { content: DestinationContent }) {
  return (
    <section className="mx-auto w-full max-w-[1320px] px-4 py-16 sm:px-6 sm:py-20">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={stagger(0.12)}
        className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14"
      >
        {content.image && (
          <motion.div variants={fadeUp}>
            <Image
              src={content.image}
              alt={content.imageAlt || ""}
              width={600}
              height={520}
              unoptimized
              className="h-auto w-full rounded-lg object-cover"
            />
          </motion.div>
        )}

        <motion.div variants={fadeUp}>
          {content.heading && (
            <h2 className="text-2xl font-bold leading-snug text-dark-green sm:text-3xl">
              {content.heading}
            </h2>
          )}
          {content.description && (
            <p className="mt-4 text-sm leading-6 text-gray-500 sm:text-base">
              {content.description}
            </p>
          )}
          {content.bullets.length > 0 && (
            <ul className="mt-6 space-y-3">
              {content.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex items-start gap-3 text-sm text-gray-600 sm:text-[15px]"
                >
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green"
                  />
                  {bullet}
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}
