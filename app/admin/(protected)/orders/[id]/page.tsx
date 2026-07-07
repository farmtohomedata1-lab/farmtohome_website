import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateSGT, formatDateTimeSGT } from "@/lib/format";
import OrderSummaryView from "@/components/orders/OrderSummaryView";
import MarkPaidButton from "./MarkPaidButton";
import CheckStripeStatusButton from "./CheckStripeStatusButton";
import { PAYMENT_METHOD_LABELS } from "@/lib/orderPaymentLabels";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, customer: true },
  });

  if (!order) notFound();

  return (
    <div>
      <Link href="/admin/orders" className="text-sm font-semibold text-brand-green hover:underline">
        ← All Orders
      </Link>

      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          Order #{order.id.slice(-8).toUpperCase()}
        </h1>
        <span
          className={`rounded-sm px-2 py-1 text-xs font-bold uppercase ${
            order.paymentStatus === "PAID"
              ? "bg-brand-green/10 text-brand-green"
              : order.paymentStatus === "FAILED"
                ? "bg-red-100 text-red-600"
                : "bg-amber-100 text-amber-700"
          }`}
        >
          {order.paymentStatus}
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Placed by {order.customer.email} on {formatDateTimeSGT(order.createdAt)}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OrderSummaryView
            order={{
              id: order.id,
              createdAt: order.createdAt.toISOString(),
              items: order.items.map((item) => ({
                id: item.id,
                name: item.name,
                price: item.price.toNumber(),
                quantity: item.quantity,
              })),
              subtotal: order.subtotal.toNumber(),
              discountAmount: order.discountAmount.toNumber(),
              couponCode: order.couponCode,
              shippingFee: order.shippingFee.toNumber(),
              total: order.total.toNumber(),
              paymentMethod: order.paymentMethod,
              deliveryDate: order.deliveryDate ? order.deliveryDate.toISOString() : null,
              orderNotes: order.orderNotes,
              shippingFullName: order.shippingFullName,
              shippingPhone: order.shippingPhone,
              shippingBlockStreet: order.shippingBlockStreet,
              shippingUnitNumber: order.shippingUnitNumber,
              shippingPostalCode: order.shippingPostalCode,
              landmark: order.landmark,
            }}
          />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-dark-green">
            Payment &amp; Fulfillment
          </h2>
          <dl className="mt-3 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <dt>Method</dt>
              <dd className="font-medium text-gray-900">
                {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Status</dt>
              <dd className="font-medium text-gray-900">{order.paymentStatus}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Customer declared paid</dt>
              <dd className="font-medium text-gray-900">
                {order.customerDeclaredPaid ? "Yes" : "No"}
              </dd>
            </div>
            {order.stripePaymentIntentId && (
              <div className="flex justify-between gap-3">
                <dt className="shrink-0">Stripe PaymentIntent</dt>
                <dd className="truncate font-mono text-xs text-gray-900" title={order.stripePaymentIntentId}>
                  {order.stripePaymentIntentId}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Delivery date</dt>
              <dd className="font-medium text-gray-900">
                {order.deliveryDate ? formatDateSGT(order.deliveryDate, "short") : "Not specified"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Landmark</dt>
              <dd className="font-medium text-gray-900">{order.landmark || "—"}</dd>
            </div>
          </dl>

          {/* Stripe orders confirm themselves via webhook — a manual override
              here would just race with (or contradict) that automatic
              status. Still shown for PayNow and any legacy COD orders. */}
          {order.paymentMethod !== "STRIPE" && order.paymentStatus !== "PAID" && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <MarkPaidButton orderId={order.id} />
            </div>
          )}

          {/* Recovery path for a missed/delayed webhook — asks Stripe
              directly for this PaymentIntent's real status rather than
              waiting indefinitely for a webhook that may never arrive. */}
          {order.paymentMethod === "STRIPE" && order.paymentStatus === "PENDING" && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <CheckStripeStatusButton orderId={order.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
