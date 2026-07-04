"use client";

import { useState, useTransition } from "react";
import { updateProfileName } from "@/app/account/actions";

export default function ProfileSection({
  email,
  name,
}: {
  email: string;
  name: string;
}) {
  const [value, setValue] = useState(name);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateProfileName(value);
      setMessage(result.error ?? "Saved.");
    });
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-base font-bold text-dark-green">Profile</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:max-w-sm">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-dark-green focus:outline-none focus:ring-1 focus:ring-dark-green"
          />
        </div>
      </div>
      {message && <p className="mt-2 text-sm text-brand-green">{message}</p>}
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="mt-3 rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save"}
      </button>
    </section>
  );
}
