"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { header, navBar } from "@/content/homepage";
import { fadeIn, buttonMotion } from "./motion";
import {
  IconCart,
  IconChevronDown,
  IconClose,
  IconHeart,
  IconMenu,
  IconPin,
  IconSearch,
  IconUser,
} from "./icons";
import Logo from "./Logo";

function SearchBar() {
  return (
    <form
      role="search"
      onSubmit={(e) => e.preventDefault()}
      className="flex w-full items-stretch overflow-hidden rounded-md bg-white"
    >
      <button
        type="button"
        className="hidden shrink-0 items-center gap-2 border-r border-gray-200 px-4 text-sm font-medium text-dark-green sm:flex"
      >
        <IconMenu className="h-4 w-4" />
        {header.categoriesLabel}
        <IconChevronDown className="h-3.5 w-3.5 text-gray-400" />
      </button>
      <input
        type="search"
        placeholder={header.searchPlaceholder}
        className="min-w-0 flex-1 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
      />
      <motion.button
        {...buttonMotion}
        type="submit"
        className="m-1 flex shrink-0 items-center gap-2 rounded-md bg-brand-green px-5 text-sm font-semibold text-white"
      >
        <span className="hidden sm:inline">{header.searchButton}</span>
        <IconSearch className="h-4 w-4" />
      </motion.button>
    </form>
  );
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-green text-[10px] font-bold text-white">
      {count}
    </span>
  );
}

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <motion.header
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="bg-dark-green"
    >
      <div className="mx-auto flex w-full max-w-[1320px] items-center gap-4 px-4 py-4 sm:px-6 lg:gap-8">
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="text-white lg:hidden"
        >
          {menuOpen ? (
            <IconClose className="h-6 w-6" />
          ) : (
            <IconMenu className="h-6 w-6" />
          )}
        </button>

        <Logo prefix={header.logoPrefix} suffix={header.logoSuffix} />

        <div className="hidden flex-1 lg:block">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-3 lg:ml-0">
          <motion.a
            {...buttonMotion}
            href="#"
            className="hidden items-center gap-2 rounded-md border border-white/40 px-4 py-2.5 text-sm font-medium text-white md:flex"
          >
            <IconUser className="h-4 w-4" />
            {header.account}
          </motion.a>
          <motion.a
            {...buttonMotion}
            href="#"
            className="flex items-center gap-2 rounded-md bg-white px-3 py-2.5 text-sm font-medium text-dark-green sm:px-4"
          >
            <span className="relative">
              <IconHeart className="h-4 w-4" />
              <CountBadge count={header.wishlistCount} />
            </span>
            <span className="hidden sm:inline">{header.wishlist}</span>
          </motion.a>
          <motion.a
            {...buttonMotion}
            href="#"
            className="flex items-center gap-2 rounded-md bg-white px-3 py-2.5 text-sm font-medium text-dark-green sm:px-4"
          >
            <span className="relative">
              <IconCart className="h-4 w-4" />
              <CountBadge count={header.cartCount} />
            </span>
            <span className="hidden sm:inline">{header.cart}</span>
          </motion.a>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1320px] px-4 pb-4 sm:px-6 lg:hidden">
        <SearchBar />
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-t border-white/10 lg:hidden"
          >
            <ul className="mx-auto w-full max-w-[1320px] px-4 py-3 sm:px-6">
              {navBar.links.map((link) => {
                const isActive = link.href !== "#" && pathname === link.href;
                return (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={`block py-2.5 text-sm font-medium transition-colors hover:text-white ${
                        isActive ? "text-white underline" : "text-white/90"
                      }`}
                    >
                      {link.label}
                    </a>
                  </li>
                );
              })}
              <li className="mt-2 flex items-center gap-2 border-t border-white/10 pt-3 text-xs text-white/70">
                <IconPin className="h-4 w-4" />
                {navBar.delivery}
              </li>
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
