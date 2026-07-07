"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { FormEvent } from "react";
import { continueWithPassword, type LoginState } from "./actions";
import TurnstileWidget from "@/components/common/TurnstileWidget";

const initialState: LoginState = {};

export default function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, isPending] = useActionState(continueWithPassword, initialState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mismatchError, setMismatchError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");

  // The server only knows an account is missing for the exact email it just
  // checked — if the visitor edits the email afterward, drop back to the
  // simple single-field view immediately (client-side, no round-trip) rather
  // than showing a stale "create account" prompt for a different address.
  const showConfirmField = state.needsAccountCreation === true && email === state.checkedEmail;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    if (showConfirmField && password !== confirmPassword) {
      e.preventDefault();
      setMismatchError("Passwords do not match.");
      return;
    }
    setMismatchError(null);
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />
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
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          minLength={8}
          autoComplete={showConfirmField ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-dark-green focus:outline-none focus:ring-1 focus:ring-dark-green"
        />
        {!showConfirmField && <p className="mt-1 text-xs text-gray-400">At least 8 characters.</p>}
      </div>

      {showConfirmField && (
        <div>
          <p className="mb-3 rounded-md bg-brand-green/10 px-3 py-2 text-sm text-dark-green">
            We don&apos;t have an account for <strong>{email}</strong> yet — confirm your
            password below to create one.
          </p>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-dark-green focus:outline-none focus:ring-1 focus:ring-dark-green"
          />
          {passwordsMismatch && (
            <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
          )}
        </div>
      )}

      {!showConfirmField && (
        <div className="-mt-1 text-right">
          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-brand-green hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      )}

      <TurnstileWidget onVerify={setTurnstileToken} />

      {(mismatchError || state.error) && (
        <p role="alert" className="text-sm text-red-600">
          {mismatchError ?? state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-md bg-brand-green px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
      >
        {isPending ? "Please wait..." : showConfirmField ? "Create Account" : "Continue"}
      </button>
    </form>
  );
}
