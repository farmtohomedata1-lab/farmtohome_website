"use client";

import { motion } from "framer-motion";
import type { WhyChooseContent } from "@/content/about";
import { cardLift, fadeUp, stagger, viewportOnce } from "@/components/home/motion";
import { whyChooseIcons } from "@/components/home/icons";
import { IconLeaf } from "@/components/home/icons";

export default function WhyChooseUs({ content }: { content: WhyChooseContent }) {
  if (content.cards.length === 0) return null;

  return (
    <section className="bg-gray-section py-16 sm:py-20">
      <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          {content.heading && (
            <h2 className="text-2xl font-bold text-dark-green sm:text-3xl">
              {content.heading}
            </h2>
          )}
          {content.subtext && (
            <p className="mt-3 text-sm leading-6 text-gray-500 sm:text-base">
              {content.subtext}
            </p>
          )}
        </div>

        <motion.ul
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={stagger()}
          className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {content.cards.map((card) => {
            const Icon = whyChooseIcons[card.icon] ?? IconLeaf;
            return (
              <motion.li
                key={card.id}
                variants={fadeUp}
                whileHover={cardLift}
                className="relative overflow-hidden rounded-lg bg-white p-8 text-center"
              >
                {card.number && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 text-6xl font-extrabold text-gray-100"
                  >
                    {card.number}
                  </span>
                )}
                <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/10">
                  <Icon className="h-7 w-7 text-brand-green" />
                </span>
                {card.title && (
                  <h3 className="relative mt-5 text-lg font-bold text-dark-green">
                    {card.title}
                  </h3>
                )}
                {card.description && (
                  <p className="relative mt-2 text-sm leading-6 text-gray-500">
                    {card.description}
                  </p>
                )}
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}
