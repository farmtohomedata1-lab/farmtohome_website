"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { header, navBar } from "@/content/homepage";
import { useCartStore, selectCartTotalCount } from "@/lib/cartStore";
import { useWishlistStore, selectWishlistCount } from "@/lib/wishlistStore";
import { useHydrated } from "@/lib/useHydrated";
import type { CustomerHeaderInfo } from "@/lib/auth/getCustomerHeaderInfo";
import AccountMenu from "./AccountMenu";
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
import { handleHashNavClick } from "./hashNav";

const MotionLink = motion.create(Link);

function SearchBar() {
  const router = useRouter();

  // Deliberately uncontrolled + never prefilled from the current URL's `q`,
  // so this component doesn't need useSearchParams() (which would force a
  // Suspense boundary around SiteHeader on every page that renders it).
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const term = String(new FormData(e.currentTarget).get("q") ?? "").trim();
    router.push(term ? `/shop?q=${encodeURIComponent(term)}` : "/shop");
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
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
        name="q"
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
    <motion.span
      key={count}
      initial={{ scale: 1.5 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 15 }}
      className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-green text-[10px] font-bold text-white"
    >
      {count}
    </motion.span>
  );
}

// Receives the customer's auth state already resolved server-side (see
// SiteHeader.tsx) — no client-side fetch-then-swap here, which is what used
// to cause a brief "Login" flash before the real logged-in state appeared.
// The only client-side write to this state is the optimistic clear on
// sign-out below, for instant feedback ahead of the follow-up navigation.
export default function SiteHeaderClient({
  initialCustomerInfo,
}: {
  initialCustomerInfo: CustomerHeaderInfo | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const cartCount = useCartStore(selectCartTotalCount);
  const wishlistCount = useWishlistStore(selectWishlistCount);
  // The persisted cart/wishlist stores only rehydrate from localStorage
  // after mount, so the very first client render must match the server's
  // (0) to avoid a hydration warning — swap in the real counts right after.
  const mounted = useHydrated();

  const [customerInfo, setCustomerInfo] = useState<CustomerHeaderInfo | null>(
    initialCustomerInfo
  );

  return (
    <motion.header
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="bg-dark-green"
    >
      <div className="mx-auto grid w-full max-w-[1320px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-4 sm:px-6 lg:flex lg:gap-8">
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="order-3 justify-self-end text-white lg:order-1 lg:hidden"
        >
          {menuOpen ? (
            <IconClose className="h-6 w-6" />
          ) : (
            <IconMenu className="h-6 w-6" />
          )}
        </button>

        <div className="order-2 justify-self-center lg:order-2">
          <Logo priority />
        </div>

        <div className="order-4 hidden flex-1 lg:order-3 lg:block">
          <SearchBar />
        </div>

        <div className="order-1 flex items-center gap-3 justify-self-start lg:order-4">
          {customerInfo ? (
            <AccountMenu customerInfo={customerInfo} onSignedOut={() => setCustomerInfo(null)} />
          ) : (
            <MotionLink
              {...buttonMotion}
              href="/login"
              className="hidden items-center gap-2 rounded-md border border-white/40 px-4 py-2.5 text-sm font-medium text-white md:flex"
            >
              <IconUser className="h-4 w-4 shrink-0" />
              <span>Login</span>
            </MotionLink>
          )}
          <MotionLink
            {...buttonMotion}
            href="/wishlist"
            className="flex items-center gap-2 rounded-md bg-white px-3 py-2.5 text-sm font-medium text-dark-green sm:px-4"
          >
            <span className="relative">
              <IconHeart className="h-4 w-4" />
              <CountBadge count={mounted ? wishlistCount : 0} />
            </span>
            <span className="hidden sm:inline">{header.wishlist}</span>
          </MotionLink>
          <MotionLink
            {...buttonMotion}
            href="/cart"
            className="flex items-center gap-2 rounded-md bg-white px-3 py-2.5 text-sm font-medium text-dark-green sm:px-4"
          >
            <span className="relative">
              <IconCart className="h-4 w-4" />
              <CountBadge count={mounted ? cartCount : 0} />
            </span>
            <span className="hidden sm:inline">{header.cart}</span>
          </MotionLink>
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
                    <Link
                      href={link.href}
                      onClick={(e) => {
                        handleHashNavClick(e, link.href, pathname);
                        setMenuOpen(false);
                      }}
                      className={`block py-2.5 text-sm font-medium transition-colors hover:text-white ${
                        isActive ? "text-white underline" : "text-white/90"
                      }`}
                    >
                      {link.label}
                    </Link>
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
