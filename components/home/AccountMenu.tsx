"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createCustomerClient } from "@/lib/supabase/customerClient";
import type { CustomerHeaderInfo } from "@/lib/auth/getCustomerHeaderInfo";
import { buttonMotion } from "./motion";
import { IconChevronDown, IconUser } from "./icons";

// Logged-in state of the header's account button: a small dropdown with
// "My Account" and "Sign Out", instead of the plain link used when logged
// out (see SiteHeader.tsx). Signs out via the browser Supabase client
// directly so the session cookie clears and the header can flip back to
// "Login" immediately, with no full page reload.
export default function AccountMenu({
  customerInfo,
  onSignedOut,
}: {
  customerInfo: CustomerHeaderInfo;
  onSignedOut: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
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

  async function handleSignOut() {
    setIsSigningOut(true);
    const supabase = createCustomerClient();
    await supabase.auth.signOut();
    setOpen(false);
    onSignedOut();
    // Any page could have rendered customer-specific content while
    // authenticated (e.g. /account, /checkout) — navigate home rather than
    // leaving that stale underneath the now-signed-out header.
    router.push("/");
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
            disabled={isSigningOut}
            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 disabled:opacity-60"
          >
            {isSigningOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      )}
    </div>
  );
}
