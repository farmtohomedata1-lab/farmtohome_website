"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { signOutCustomer } from "@/lib/auth/actions";
import type { CustomerHeaderInfo } from "@/lib/auth/getCustomerHeaderInfo";
import { buttonMotion } from "./motion";
import { IconChevronDown, IconUser } from "./icons";

// Logged-in state of the header's account button: a small dropdown with
// "My Account" and "Sign Out", instead of the plain link used when logged
// out (see SiteHeader.tsx). Sign-out itself is a Server Action
// (signOutCustomer) — the session cookie is httpOnly, so only the server can
// actually clear it; see the comment on signOutCustomer for why a
// client-side supabase.auth.signOut() call here didn't work. onSignedOut()
// flips the header's local state immediately for a snappy transition while
// the redirect the action triggers is still in flight.
export default function AccountMenu({
  customerInfo,
  onSignedOut,
}: {
  customerInfo: CustomerHeaderInfo;
  onSignedOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSignOut() {
    setOpen(false);
    onSignedOut();
    startTransition(() => signOutCustomer());
  }

  const label = customerInfo.name || customerInfo.email;

  return (
    <div ref={containerRef} className="relative hidden md:block">
      <motion.button
        {...buttonMotion}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-md border border-white/40 px-4 py-2.5 text-sm font-medium text-white"
      >
        <IconUser className="h-4 w-4 shrink-0" />
        <span className="max-w-[10rem] truncate">{label}</span>
        <IconChevronDown className="h-3.5 w-3.5 shrink-0" />
      </motion.button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          <Link
            href="/account"
            role="menuitem"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            My Account
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={isPending}
            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 disabled:opacity-60"
          >
            {isPending ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      )}
    </div>
  );
}
