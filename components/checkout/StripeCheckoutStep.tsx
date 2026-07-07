"use client";

import { Elements } from "@stripe/react-stripe-js";
import type { Appearance } from "@stripe/stripe-js";
import { getStripePromise } from "@/lib/stripe/client";
import StripePaymentForm from "./StripePaymentForm";

// Matches the site's own palette (app/globals.css @theme) so Stripe's
// embedded form reads as part of the page, not a bolted-on widget.
const appearance: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#629d23", // brand-green
    colorText: "#1f2937",
    colorDanger: "#e02b2b", // sale-red
    borderRadius: "6px",
    fontSizeBase: "14px",
  },
};

// Purely presentational: given a PaymentIntent client secret, mount Stripe's
// embedded form. Reused both on /checkout (a brand-new order) and on
// /order-confirmation (retrying a failed order) — `key={clientSecret}` forces
// a clean remount whenever the secret changes so a retry never reuses stale
// Elements state from a previous attempt.
export default function StripeCheckoutStep({
  clientSecret,
  orderId,
  total,
}: {
  clientSecret: string;
  orderId: string;
  total: number;
}) {
  return (
    <Elements key={clientSecret} stripe={getStripePromise()} options={{ clientSecret, appearance }}>
      <StripePaymentForm orderId={orderId} total={total} />
    </Elements>
  );
}
