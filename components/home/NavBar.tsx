"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { navBar } from "@/content/homepage";
import { fadeIn } from "./motion";
import { IconPin } from "./icons";

export default function NavBar() {
  const pathname = usePathname();

  return (
    <motion.nav
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="hidden bg-brand-green lg:block"
    >
      <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between px-4 sm:px-6">
        <ul className="flex items-center">
          {navBar.links.map((link) => {
            const isActive = link.href !== "#" && pathname === link.href;
            return (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className={`block px-4 py-3.5 text-sm font-semibold transition-colors first:pl-0 hover:text-dark-green ${
                    isActive
                      ? "text-white underline decoration-2 underline-offset-8"
                      : "text-white"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="flex items-center gap-2 text-sm font-medium text-white">
          <IconPin className="h-4 w-4" />
          {navBar.delivery}
        </p>
      </div>
    </motion.nav>
  );
}
