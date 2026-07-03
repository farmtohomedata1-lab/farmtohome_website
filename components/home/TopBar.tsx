"use client";

import { motion } from "framer-motion";
import { topBar } from "@/content/homepage";
import { fadeIn } from "./motion";

export default function TopBar() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="bg-dark-green text-white/80"
    >
      <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-4 px-4 py-2 text-xs sm:px-6">
        <p>{topBar.welcome}</p>
        <ul className="hidden items-center gap-5 md:flex">
          {topBar.links.map((link) => (
            <li key={link.label}>
              <a href={link.href} className="transition-colors hover:text-white">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
