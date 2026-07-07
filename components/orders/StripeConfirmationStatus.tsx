"use client";

import { useEffect, useState } from "react";
import { getOrderPaymentStatus, retryStripePayment } from "@/app/checkout/actions";
import StripeCheckoutStep from "@/components/checkout/StripeCheckoutStep";
import { IconShieldCheck } from "@/components/home/icons";

const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 24; // ~1 minute — long enough for a normal webhook round-trip

// The webhook (app/api/webhooks/stripe/route.ts) is the only thing that ever
// sets a Stripe order's real paymentStatus — this component never assumes
// success just because the customer landed here after a Stripe redirect. It
// polls the DB-backed status instead, and offers a same-order retry (no
// duplicate order) if the payment actually failed.
export default function StripeConfirmationStatus({
  orderId,
  initialPaymentStatus,
  total,
}: {
  orderId: string;
  initialPaymentStatus: string;
  total: number;
}) {
  const [status, setStatus] = useState(initialPaymentStatus);
  const [pollCount, setPollCount] = useState(0);
  const [retryClientSecret, setRetryClientSecret] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (status !== "PENDING" || pollCount >= MAX_POLLS) return;
    let cancelled = false;

    const timeout = setTimeout(async () => {
      const result = await getOrderPaymentStatus(orderId);
      if (cancelled) return;
      if (result.paymentStatus && result.paymentStatus !== "PENDING") {
        setStatus(result.paymentStatus);
      } else {
        setPollCount((count) => count + 1);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [status, pollCount, orderId]);

  async function handleRetry() {
    setIsRetrying(true);
    setRetryError(null);
    const result = await retryStripePayment(orderId);
    setIsRetrying(false);
    if (result.error || !result.clientSecret) {
      setRetryError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    setRetryClientSecret(result.clientSecret);
    setStatus("PENDING");
    setPollCount(0);
  }

  if (retryClientSecret) {
    return <StripeCheckoutStep orderId={orderId} clientSecret={retryClientSecret} total={total} />;
  }

  if (status === "PAID") {
    return (
      <div className="flex items-center gap-3 rounded-md bg-brand-green/10 px-4 py-4 text-dark-green">
        <IconShieldCheck className="h-5 w-5 shrink-0 text-brand-green" />
        <p className="text-sm font-medium">Payment confirmed — thank you!</p>
      </div>
    );
  }

  if (status === "FAILED") {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-4">
        <p className="text-sm font-semibold text-red-700">Payment failed</p>
        <p className="mt-1 text-sm text-red-600">
          Your card was declined or the payment didn&apos;t go through. Your order is saved — you
          can try paying again, no need to reorder.
        </p>
        {retryError && <p className="mt-2 text-xs text-red-600">{retryError}</p>}
        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          className="mt-3 rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isRetrying ? "Preparing..." : "Retry Payment"}
        </button>
      </div>
    );
  }

  if (pollCount >= MAX_POLLS) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-4">
        <p className="text-sm font-semibold text-amber-800">Still confirming your payment</p>
        <p className="mt-1 text-sm text-amber-700">
          This is taking longer than usual. Refresh this page in a moment — if it still hasn&apos;t
          updated after a few minutes, contact us and we&apos;ll check on it.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-md bg-amber-50 px-4 py-4 text-amber-800">
      <span
        aria-hidden="true"
        className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-amber-600 border-t-transparent"
      />
      <p className="text-sm font-medium">Confirming your payment...</p>
    </div>
  );
}
