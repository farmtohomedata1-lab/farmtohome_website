"use client";

import { motion } from "framer-motion";
import type { Feature } from "@/content/homepage";
import { scaleIn, stagger, viewportOnce } from "./motion";
import { featureIcons } from "./icons";
import { IconTag } from "./icons";

export default function FeatureBand({ features }: { features: Feature[] }) {
  if (features.length === 0) return null;

  return (
    <section className="bg-brand-green py-8">
      <motion.ul
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={stagger()}
        className="mx-auto grid w-full max-w-[1320px] gap-6 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4"
      >
        {features.map((feature) => {
          const Icon = featureIcons[feature.icon] ?? IconTag;
          return (
            <motion.li
              key={feature.id}
              variants={scaleIn}
              className="flex items-start gap-3"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white">
                <Icon className="h-5 w-5 text-dark-green" />
              </span>
              <div>
                {feature.title && (
                  <h3 className="text-sm font-bold text-white">{feature.title}</h3>
                )}
                {feature.description && (
                  <p className="mt-1 text-xs leading-5 text-white/80">
                    {feature.description}
                  </p>
                )}
              </div>
            </motion.li>
          );
        })}
      </motion.ul>
    </section>
  );
}
