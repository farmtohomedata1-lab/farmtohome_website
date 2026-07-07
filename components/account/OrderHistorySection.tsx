import Link from "next/link";
import { formatDateSGT, formatPrice } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/orderPaymentLabels";

export interface AccountOrderSummary {
  id: string;
  createdAt: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  itemCount: number;
}

export default function OrderHistorySection({ orders }: { orders: AccountOrderSummary[] }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-base font-bold text-dark-green">Order History</h2>

      {orders.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">You haven&apos;t placed any orders yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/order-confirmation/${order.id}`}
              className="flex items-center justify-between rounded-md border border-gray-200 p-4 hover:bg-gray-50"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Order #{order.id.slice(-8).toUpperCase()}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDateSGT(order.createdAt, "short")} · {order.itemCount} item
                  {order.itemCount === 1 ? "" : "s"} ·{" "}
                  {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-dark-green">{formatPrice(order.total)}</p>
                <p className="text-xs text-gray-500">{order.paymentStatus}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
