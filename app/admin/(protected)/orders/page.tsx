import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateSGT, formatPrice } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/orderPaymentLabels";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true, _count: { select: { items: true } } },
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Orders</h1>
      <p className="mt-1 text-sm text-gray-500">
        {orders.length} order{orders.length === 1 ? "" : "s"} placed.
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Delivery Date</th>
              <th className="px-4 py-3">Placed</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No orders yet.
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-semibold text-brand-green hover:underline"
                  >
                    #{order.id.slice(-8).toUpperCase()}
                  </Link>
                  <p className="text-xs text-gray-400">{order._count.items} item(s)</p>
                </td>
                <td className="px-4 py-3 text-gray-700">{order.customer.email}</td>
                <td className="px-4 py-3 font-semibold text-dark-green">
                  {formatPrice(order.total.toNumber())}
                </td>
                <td className="px-4 py-3">
                  <p className="text-gray-700">
                    {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
                  </p>
                  <span
                    className={`inline-block rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      order.paymentStatus === "PAID"
                        ? "bg-brand-green/10 text-brand-green"
                        : order.paymentStatus === "FAILED"
                          ? "bg-red-100 text-red-600"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {order.deliveryDate ? formatDateSGT(order.deliveryDate, "short") : "—"}
                </td>
                <td className="px-4 py-3 text-gray-500">{formatDateSGT(order.createdAt, "short")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
