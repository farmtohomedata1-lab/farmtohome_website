"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { BlogContent } from "@/content/homepage";
import { cardLift, fadeUp, stagger, viewportOnce } from "./motion";
import { IconClock, IconPlus, IconTag } from "./icons";
import SectionHeading from "./SectionHeading";

export default function BlogSection({ content }: { content: BlogContent }) {
  if (content.posts.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1320px] px-4 py-12 sm:px-6">
      {content.heading && <SectionHeading title={content.heading} />}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={stagger()}
        className="mt-6 grid gap-6 md:grid-cols-3"
      >
        {content.posts.map((post) => (
          <motion.article
            key={post.id}
            variants={fadeUp}
            whileHover={cardLift}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            {post.image && (
              <Image
                src={post.image}
                alt={post.imageAlt || ""}
                width={600}
                height={400}
                unoptimized
                className="h-44 w-full rounded-md object-cover"
              />
            )}
            {(post.date || post.category) && (
              <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                {post.date && (
                  <span className="flex items-center gap-1.5">
                    <IconClock className="h-3.5 w-3.5" />
                    {post.date}
                  </span>
                )}
                {post.category && (
                  <span className="flex items-center gap-1.5">
                    <IconTag className="h-3.5 w-3.5" />
                    {post.category}
                  </span>
                )}
              </div>
            )}
            {post.title && (
              <h3 className="mt-3 text-[15px] font-bold leading-snug text-dark-green">
                {post.title}
              </h3>
            )}
            {content.readMore && (
              <a
                href="#"
                className="mt-4 flex items-center gap-2 text-xs font-semibold text-dark-green transition-colors hover:text-brand-green"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-green text-white">
                  <IconPlus className="h-3.5 w-3.5" />
                </span>
                {content.readMore}
              </a>
            )}
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}
