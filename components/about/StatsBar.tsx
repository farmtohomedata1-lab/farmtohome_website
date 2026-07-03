"use client";

import { motion } from "framer-motion";
import type { StatItem } from "@/content/about";
import { fadeUp, stagger, viewportOnce } from "@/components/home/motion";

export default function StatsBar({ stats }: { stats: StatItem[] }) {
  if (stats.length === 0) return null;

  return (
    <section className="relative z-10 mx-auto -mt-12 w-full max-w-[1100px] px-4 sm:-mt-16 sm:px-6">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={stagger()}
        className="grid grid-cols-1 gap-6 rounded-lg bg-white px-6 py-8 shadow-lg sm:grid-cols-2 sm:gap-4 xl:grid-cols-4 xl:divide-x xl:divide-gray-200"
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.id}
            variants={fadeUp}
            className="flex flex-col items-center text-center"
          >
            {stat.value && (
              <p className="text-2xl font-bold text-dark-green sm:text-3xl">
                {stat.value}
              </p>
            )}
            {stat.label && (
              <p className="mt-1 text-xs font-medium text-gray-500 sm:text-sm">
                {stat.label}
              </p>
            )}
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
