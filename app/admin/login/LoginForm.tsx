"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type LoginState } from "./actions";

const initialState: LoginState = {};

// Turnstile/CAPTCHA is deliberately NOT rendered here right now — Supabase
// Attack Protection (CAPTCHA) is turned OFF for this project, and brute-force
// protection is instead handled by the app's own DB-backed rate limiter
// (lib/auth/rateLimit.ts: 5 failed attempts / 15-minute lockout, already
// proven working). signIn() still accepts an optional turnstileToken field
// so Turnstile can be reintroduced later as a widget here without any server
// changes — see app/admin/login/actions.ts.
export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-dark-green focus:outline-none focus:ring-1 focus:ring-dark-green"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-dark-green focus:outline-none focus:ring-1 focus:ring-dark-green"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="-mt-1 text-right">
        <Link
          href="/admin/forgot-password"
          className="text-xs font-semibold text-brand-green hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-md bg-brand-green px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
      >
        {isPending ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
