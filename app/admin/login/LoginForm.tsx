"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signIn, type LoginState } from "./actions";
import TurnstileWidget from "@/components/common/TurnstileWidget";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);
  const [turnstileToken, setTurnstileToken] = useState("");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/*
        Same Cloudflare Turnstile token the customer login form sends
        (components/common/TurnstileWidget). Required because this project's
        Supabase project has CAPTCHA protection enabled — signInWithPassword
        is rejected server-side without a valid token. Renders nothing (and
        sends an empty token) until NEXT_PUBLIC_TURNSTILE_SITE_KEY is set, so
        this is inert until Turnstile is configured.
      */}
      <input type="hidden" name="turnstileToken" value={turnstileToken} />
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

      <TurnstileWidget onVerify={setTurnstileToken} />

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
