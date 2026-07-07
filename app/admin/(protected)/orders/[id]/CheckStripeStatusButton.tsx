"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkStripePaymentStatus } from "../actions";

export default function CheckStripeStatusButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await checkStripePaymentStatus(orderId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage(result.message ?? null);
      // Re-fetch server data so the page reflects the new paymentStatus —
      // e.g. this button itself disappears once the order is no longer
      // PENDING, since checking again would be pointless past that point.
      router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-md border border-brand-green px-4 py-2 text-sm font-semibold text-brand-green hover:bg-brand-green/5 disabled:opacity-60"
      >
        {isPending ? "Checking with Stripe..." : "Check Payment Status"}
      </button>
      {message && <p className="mt-2 text-sm text-dark-green">{message}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
