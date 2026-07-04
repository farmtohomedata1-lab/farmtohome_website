"use client";

import { motion } from "framer-motion";

// Brief circle-then-checkmark draw-in (~0.7s total) — a quick, tasteful
// confirmation, not something the customer has to wait on before reading
// their order details below it.
export default function SuccessCheckmark() {
  return (
    <motion.svg
      width="48"
      height="48"
      viewBox="0 0 56 56"
      fill="none"
      className="shrink-0 text-brand-green"
      initial="hidden"
      animate="visible"
    >
      <motion.circle
        cx="28"
        cy="28"
        r="25"
        stroke="currentColor"
        strokeWidth="3"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: { pathLength: 1, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
        }}
      />
      <motion.path
        d="M17 29L24.5 36.5L39 20"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: {
            pathLength: 1,
            opacity: 1,
            transition: { duration: 0.3, delay: 0.35, ease: "easeOut" },
          },
        }}
      />
    </motion.svg>
  );
}
