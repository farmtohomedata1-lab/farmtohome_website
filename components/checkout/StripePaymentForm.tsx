"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { formatPrice } from "@/lib/format";
import { IconShieldCheck } from "@/components/home/icons";

export default function StripePaymentForm({ orderId, total }: { orderId: string; total: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setError(null);

    // Stripe handles the actual charge directly with the customer's bank —
    // this call never touches our server. A successful or 3D-Secure-requiring
    // confirmation navigates the browser to return_url; this function only
    // resolves in place for a synchronous failure (e.g. instantly-declined
    // test card) or a client-side validation problem with the entered card.
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation/${orderId}`,
      },
    });

    if (confirmError) {
      setError(confirmError.message ?? "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-1 flex items-center gap-2">
        <IconShieldCheck className="h-4 w-4 text-brand-green" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-dark-green">
          Pay by Card
        </h2>
      </div>
      <p className="mb-4 text-xs text-gray-500">
        Payments are processed securely by Stripe — we never see or store your card details.
      </p>

      <PaymentElement />

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || isSubmitting}
        className="mt-5 w-full rounded-md bg-brand-green py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
      >
        {isSubmitting ? "Processing..." : `Pay ${formatPrice(total)}`}
      </button>
    </form>
  );
}
