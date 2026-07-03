"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { AboutHeroContent } from "@/content/about";
import { buttonMotion, fadeUp, stagger } from "@/components/home/motion";

export default function AboutHero({ content }: { content: AboutHeroContent }) {
  return (
    <section className="relative isolate overflow-hidden">
      {content.backgroundImage && (
        <Image
          src={content.backgroundImage}
          alt={content.imageAlt || ""}
          fill
          priority
          unoptimized
          className="-z-10 object-cover object-center"
        />
      )}
      <div className="absolute inset-0 -z-10 bg-dark-green/70" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger(0.15)}
        className="mx-auto flex w-full max-w-[1320px] flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32"
      >
        {content.heading && (
          <motion.h1
            variants={fadeUp}
            className="max-w-2xl text-3xl font-bold text-white sm:text-4xl lg:text-5xl"
          >
            {content.heading}
          </motion.h1>
        )}
        {content.description && (
          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-2xl text-sm leading-6 text-white/85 sm:text-base"
          >
            {content.description}
          </motion.p>
        )}
        {content.cta && (
          <motion.a
            {...buttonMotion}
            variants={fadeUp}
            href={content.ctaHref || "#"}
            className="mt-7 rounded-md bg-brand-green px-7 py-3 text-sm font-semibold text-white"
          >
            {content.cta}
          </motion.a>
        )}
      </motion.div>
    </section>
  );
}
