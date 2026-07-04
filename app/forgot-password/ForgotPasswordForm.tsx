"use client";

import { useActionState, useState } from "react";
import { requestPasswordReset, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = {};

export default function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, initialState);
  const [submittedEmail, setSubmittedEmail] = useState("");

  if (state.status === "sent") {
    return (
      <div className="rounded-md bg-brand-green/10 px-4 py-3 text-sm text-dark-green">
        <p className="font-semibold">Check your email</p>
        <p className="mt-1">
          If an account exists for <strong>{submittedEmail}</strong>, we&apos;ve sent a link to
          reset the password.
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        const email = new FormData(e.currentTarget).get("email");
        setSubmittedEmail(String(email || ""));
      }}
      className="flex flex-col gap-4"
    >
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
        {isPending ? "Sending..." : "Send Reset Link"}
      </button>
    </form>
  );
}
