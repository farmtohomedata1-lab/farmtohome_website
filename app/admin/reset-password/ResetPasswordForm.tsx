"use client";

import { useActionState, useState } from "react";
import type { FormEvent } from "react";
import { updateAdminPassword, type AdminResetState } from "./actions";

const initialState: AdminResetState = {};

export default function AdminResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(updateAdminPassword, initialState);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mismatchError, setMismatchError] = useState<string | null>(null);

  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    if (password !== confirmPassword) {
      e.preventDefault();
      setMismatchError("Passwords do not match.");
      return;
    }
    setMismatchError(null);
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-dark-green focus:outline-none focus:ring-1 focus:ring-dark-green"
        />
        <p className="mt-1 text-xs text-gray-400">At least 8 characters.</p>
      </div>
      <div>
        <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-gray-700">
          Confirm new password
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
        {passwordsMismatch && <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>}
      </div>

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
        {isPending ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
