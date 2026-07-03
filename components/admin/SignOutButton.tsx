"use client";

import { useTransition } from "react";
import { signOut } from "@/lib/auth/actions";

export default function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => signOut())}
      className="rounded-md border border-white/30 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-60"
    >
      {isPending ? "Signing out..." : "Sign Out"}
    </button>
  );
}
