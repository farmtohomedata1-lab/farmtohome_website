"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { formatPrice } from "@/lib/format";
import { declarePaymentMade } from "@/app/checkout/actions";

export default function PayNowPanel({
  orderId,
  total,
  qrImageUrl,
  paymentStatus,
  customerDeclaredPaid,
}: {
  orderId: string;
  total: number;
  qrImageUrl: string | null;
  paymentStatus: string;
  customerDeclaredPaid: boolean;
}) {
  const [declared, setDeclared] = useState(customerDeclaredPaid);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDeclarePaid() {
    setError(null);
    startTransition(async () => {
      const result = await declarePaymentMade(orderId);
      if (result.error) setError(result.error);
      else setDeclared(true);
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-dark-green">
        Pay with PayNow
      </h2>

      {qrImageUrl ? (
        <Image
          src={qrImageUrl}
          alt="PayNow QR code"
          width={220}
          height={220}
          unoptimized
          className="mx-auto mt-4 h-auto w-full max-w-[220px]"
        />
      ) : (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          QR code not configured yet — contact us to arrange payment.
        </p>
      )}

      <p className="mt-4 text-center text-sm text-gray-600">Amount to transfer</p>
      <p className="text-center text-2xl font-bold text-dark-green">{formatPrice(total)}</p>

      {paymentStatus === "PAID" ? (
        <p className="mt-4 rounded-md bg-brand-green/10 px-3 py-2 text-center text-sm font-semibold text-brand-green">
          Payment confirmed — thank you!
        </p>
      ) : declared ? (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-center text-sm text-amber-800">
          We&apos;ll confirm your payment shortly. This order is not yet marked as paid.
        </p>
      ) : (
        <>
          <button
            type="button"
            onClick={handleDeclarePaid}
            disabled={isPending}
            className="mt-4 w-full rounded-md bg-brand-green py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Updating..." : "I've made the payment"}
          </button>
          <p className="mt-2 text-center text-xs text-gray-400">
            We&apos;ll confirm your payment shortly — this does not mark the order as paid
            immediately.
          </p>
          {error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}
        </>
      )}
    </div>
  );
}
