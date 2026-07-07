"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { navBar } from "@/content/homepage";
import { fadeIn } from "./motion";
import { IconPin } from "./icons";
import { handleHashNavClick } from "./hashNav";

export default function NavBar() {
  const pathname = usePathname();

  return (
    <motion.nav
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="hidden bg-brand-green lg:block"
    >
      <div className="mx-auto grid w-full max-w-[1320px] grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6">
        <span aria-hidden="true" />
        <ul className="flex items-center justify-center">
          {navBar.links.map((link) => {
            const isActive = link.href !== "#" && pathname === link.href;
            return (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={(e) => handleHashNavClick(e, link.href, pathname)}
                  className={`block px-4 py-3.5 text-sm font-semibold transition-colors hover:text-dark-green ${
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
        <p className="flex items-center justify-end gap-2 text-sm font-medium text-white">
          <IconPin className="h-4 w-4" />
          {navBar.delivery}
        </p>
      </div>
    </motion.nav>
  );
}
