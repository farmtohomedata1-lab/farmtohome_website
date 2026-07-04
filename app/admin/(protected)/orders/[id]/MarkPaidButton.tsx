"use client";

import { useState, useTransition } from "react";
import { markOrderPaid } from "../actions";

export default function MarkPaidButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleClick() {
    if (!window.confirm("Mark this order as paid? This confirms payment was received.")) return;
    setError(null);
    startTransition(async () => {
      const result = await markOrderPaid(orderId);
      if (result.error) setError(result.error);
      else setDone(true);
    });
  }

  if (done) {
    return <p className="text-sm font-semibold text-brand-green">Marked as paid.</p>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Updating..." : "Mark as Paid"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
