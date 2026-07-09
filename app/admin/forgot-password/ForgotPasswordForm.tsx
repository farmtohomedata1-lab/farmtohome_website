"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestAdminPasswordReset, type AdminForgotState } from "./actions";

const initialState: AdminForgotState = {};

export default function AdminForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestAdminPasswordReset, initialState);

  if (state.status === "sent") {
    return (
      <div className="rounded-md bg-brand-green/10 px-4 py-3 text-sm text-dark-green">
        <p className="font-semibold">Check your inbox</p>
        <p className="mt-1">
          If that email matches an admin account, a password reset link has been sent to it.
        </p>
        <Link href="/admin/login" className="mt-3 inline-block text-xs font-semibold text-brand-green hover:underline">
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
          Admin email
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

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-md bg-brand-green px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
      >
        {isPending ? "Sending..." : "Send reset link"}
      </button>

      <Link href="/admin/login" className="text-center text-xs font-semibold text-gray-500 hover:text-brand-green">
        ← Back to sign in
      </Link>
    </form>
  );
}
