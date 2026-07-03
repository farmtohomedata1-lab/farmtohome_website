"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { TestimonialsContent } from "@/content/about";
import { cardLift, fadeUp, stagger, viewportOnce } from "@/components/home/motion";

export default function Testimonials({ content }: { content: TestimonialsContent }) {
  if (content.testimonials.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1320px] px-4 py-16 sm:px-6 sm:py-20">
      {content.heading && (
        <h2 className="text-2xl font-bold text-dark-green sm:text-3xl">
          {content.heading}
        </h2>
      )}

      <motion.ul
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={stagger()}
        className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2"
      >
        {content.testimonials.map((testimonial) => (
          <motion.li
            key={testimonial.id}
            variants={fadeUp}
            whileHover={cardLift}
            className="rounded-lg border border-gray-200 bg-white p-6 sm:p-7"
          >
            <div className="flex items-center gap-3">
              {testimonial.avatar && (
                <Image
                  src={testimonial.avatar}
                  alt={testimonial.imageAlt || ""}
                  width={48}
                  height={48}
                  unoptimized
                  className="h-12 w-12 rounded-full object-cover"
                />
              )}
              <div>
                {testimonial.name && (
                  <p className="text-sm font-bold text-dark-green">{testimonial.name}</p>
                )}
                {testimonial.role && (
                  <p className="text-xs text-brand-green">{testimonial.role}</p>
                )}
              </div>
            </div>
            {testimonial.quote && (
              <p className="mt-4 text-sm leading-6 text-gray-500">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
            )}
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
