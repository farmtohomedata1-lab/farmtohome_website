"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";
import { computeCartTotals, type CouponRate } from "@/lib/cartTotals";
import CouponForm from "@/components/cart/CouponForm";
import AddressSelector, {
  type CheckoutAddress,
  type NewAddressFieldErrors,
  type NewAddressValues,
} from "./AddressSelector";
import PaymentMethodSelector, { type PaymentMethod } from "./PaymentMethodSelector";
import CheckoutSummary from "./CheckoutSummary";
import StripeCheckoutStep from "./StripeCheckoutStep";
import { placeOrder } from "@/app/checkout/actions";

const blankNewAddress: NewAddressValues = {
  fullName: "",
  phone: "",
  blockStreet: "",
  unitNumber: "",
  postalCode: "",
  landmark: "",
  country: "",
};

// Client-side check mirroring the server action's own validation — catches
// blanks immediately with a per-field message instead of round-tripping to
// the server first, and doubles as a hard stop so nothing gets submitted
// with required fields empty.
function validateNewAddress(values: NewAddressValues): NewAddressFieldErrors {
  const errors: NewAddressFieldErrors = {};
  if (!values.fullName.trim()) errors.fullName = "Full name is required.";
  if (!values.phone.trim()) errors.phone = "Phone number is required.";
  if (!values.blockStreet.trim()) errors.blockStreet = "Address is required.";
  if (!values.postalCode.trim()) errors.postalCode = "Postal code is required.";
  else if (!/^\d{6}$/.test(values.postalCode.trim()))
    errors.postalCode = "Enter a valid 6-digit postal code.";
  if (!values.country.trim()) errors.country = "Please select a country.";
  return errors;
}

export default function CheckoutClient({
  addresses,
  freeShippingThreshold,
  standardDeliveryFee,
  couponsEnabled,
  taxEnabled,
  taxPercentage,
}: {
  addresses: CheckoutAddress[];
  freeShippingThreshold: number;
  standardDeliveryFee: number;
  couponsEnabled: boolean;
  taxEnabled: boolean;
  taxPercentage: number;
}) {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    defaultAddress?.id ?? null
  );
  const [newAddress, setNewAddress] = useState<NewAddressValues>(blankNewAddress);
  const [addressErrors, setAddressErrors] = useState<NewAddressFieldErrors>({});
  const [deliveryDate, setDeliveryDate] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PAYNOW_MANUAL");
  const [appliedCoupon, setAppliedCoupon] = useState<(CouponRate & { code: string }) | null>(
    null
  );
  const [isPlacing, startTransition] = useTransition();
  const [placeError, setPlaceError] = useState<string | null>(null);
  // Set only when a STRIPE order was just created and needs its Payment
  // Element mounted right here on this same page (never a redirect for this
  // step) — PayNow orders never touch this state, they redirect immediately
  // to /order-confirmation exactly as before.
  const [stripeCheckout, setStripeCheckout] = useState<{
    orderId: string;
    clientSecret: string;
    total: number;
  } | null>(null);

  const totals = computeCartTotals(
    items,
    appliedCoupon,
    freeShippingThreshold,
    standardDeliveryFee,
    { taxEnabled, taxPercentage }
  );

  function handlePlaceOrder() {
    setPlaceError(null);

    if (selectedAddressId == null) {
      const errors = validateNewAddress(newAddress);
      setAddressErrors(errors);
      if (Object.keys(errors).length > 0) {
        setPlaceError("Please fix the highlighted address fields.");
        return;
      }
    } else {
      setAddressErrors({});
    }

    startTransition(async () => {
      const result = await placeOrder({
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        couponCode: appliedCoupon?.code ?? null,
        address:
          selectedAddressId != null
            ? { addressId: selectedAddressId }
            : {
                fullName: newAddress.fullName,
                phone: newAddress.phone,
                blockStreet: newAddress.blockStreet,
                unitNumber: newAddress.unitNumber,
                postalCode: newAddress.postalCode,
                landmark: newAddress.landmark,
                country: newAddress.country,
              },
        deliveryDate: deliveryDate || null,
        orderNotes,
        paymentMethod,
      });

      if (result.error || !result.orderId) {
        setPlaceError(result.error ?? "Something went wrong. Please try again.");
        return;
      }

      if (result.stripeClientSecret) {
        // Capture the total BEFORE clearing the cart — clearCart() empties
        // the store `totals` is derived from, which would otherwise show
        // $0.00 on the payment step that's about to render.
        const orderTotal = totals.total;
        // Order is created (paymentStatus: PENDING) but not yet paid — stay
        // on this page and mount the Payment Element. Cart clears now since
        // the order itself already exists regardless of payment outcome; a
        // failed/abandoned payment is retried against this same order, not
        // by re-adding items to a cart.
        clearCart();
        setStripeCheckout({
          orderId: result.orderId,
          clientSecret: result.stripeClientSecret,
          total: orderTotal,
        });
        return;
      }

      clearCart();
      router.push(`/order-confirmation/${result.orderId}`);
    });
  }

  if (stripeCheckout) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-8 sm:px-6">
        <h1 className="mb-4 text-center text-lg font-bold text-dark-green">Complete Your Payment</h1>
        <StripeCheckoutStep
          orderId={stripeCheckout.orderId}
          clientSecret={stripeCheckout.clientSecret}
          total={stripeCheckout.total}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[1320px] px-4 py-16 text-center sm:px-6">
        <p className="text-lg font-semibold text-dark-green">Your cart is empty</p>
        <p className="mt-2 text-sm text-gray-500">
          Add something to your cart before checking out.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-md bg-brand-green px-6 py-3 text-sm font-semibold text-white"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-6">
      <div className="lg:flex lg:items-start lg:gap-8">
        <div className="min-w-0 flex-1 space-y-6">
          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-dark-green">
              Delivery Address
            </h2>
            <AddressSelector
              addresses={addresses}
              selectedAddressId={selectedAddressId}
              onSelect={setSelectedAddressId}
              newAddress={newAddress}
              onNewAddressChange={setNewAddress}
              fieldErrors={addressErrors}
            />
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-dark-green">
              Delivery Date
            </h2>
            <input
              type="date"
              value={deliveryDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-dark-green focus:outline-none focus:ring-1 focus:ring-dark-green"
            />
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-dark-green">
              Order Notes <span className="font-normal normal-case text-gray-400">(optional)</span>
            </h2>
            <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              rows={3}
              placeholder="Notes about your order, e.g. delivery instructions"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-dark-green focus:outline-none focus:ring-1 focus:ring-dark-green"
            />
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-dark-green">
              Payment Method
            </h2>
            <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
          </section>

          <Link href="/cart" className="inline-block text-sm font-semibold text-brand-green hover:underline">
            ← Back to Cart
          </Link>
        </div>

        <div className="mt-8 w-full shrink-0 space-y-4 lg:mt-0 lg:w-80">
          {couponsEnabled && (
            <CouponForm
              items={items}
              appliedCode={appliedCoupon?.code ?? null}
              onApplied={(code, rate) => setAppliedCoupon({ ...rate, code })}
              onCleared={() => setAppliedCoupon(null)}
            />
          )}
          <CheckoutSummary
            totals={totals}
            appliedCode={appliedCoupon?.code ?? null}
            isPlacing={isPlacing}
            error={placeError}
            onPlaceOrder={handlePlaceOrder}
          />
        </div>
      </div>
    </div>
  );
}
