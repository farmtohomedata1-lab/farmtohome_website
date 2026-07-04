import { formatPrice } from "@/lib/format";

export interface OrderSummaryItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderSummaryData {
  id: string;
  createdAt: string;
  items: OrderSummaryItem[];
  subtotal: number;
  discountAmount: number;
  couponCode: string | null;
  shippingFee: number;
  total: number;
  paymentMethod: string;
  deliveryDate: string | null;
  orderNotes: string | null;
  shippingFullName: string;
  shippingPhone: string;
  shippingBlockStreet: string;
  shippingUnitNumber: string | null;
  shippingPostalCode: string;
  landmark: string | null;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: "Cash on Delivery",
  PAYNOW_MANUAL: "PayNow",
};

// Read-only order summary — shared by the customer-facing order confirmation
// page and the admin order detail page, so the two never drift apart.
export default function OrderSummaryView({ order }: { order: OrderSummaryData }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="hidden border-b border-gray-200 bg-gray-section px-4 py-3 text-xs uppercase text-gray-500 sm:flex sm:items-center">
          <span className="flex-1">Item</span>
          <span className="flex items-center gap-8">
            <span className="w-16">Price</span>
            <span className="w-12 text-center">Qty</span>
            <span className="w-20 text-right">Subtotal</span>
          </span>
        </div>
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-1 border-b border-gray-100 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="text-sm font-medium text-gray-900">{item.name}</span>
            <span className="flex items-center gap-8 text-sm text-gray-600">
              <span className="sm:w-16">{formatPrice(item.price)}</span>
              <span className="sm:w-12 sm:text-center">×{item.quantity}</span>
              <span className="font-semibold text-dark-green sm:w-20 sm:text-right">
                {formatPrice(item.price * item.quantity)}
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-dark-green">
            Delivery Details
          </h3>
          <dl className="mt-3 space-y-1 text-sm text-gray-600">
            <p>{order.shippingFullName}</p>
            <p>{order.shippingPhone}</p>
            <p>
              {order.shippingBlockStreet}
              {order.shippingUnitNumber ? `, ${order.shippingUnitNumber}` : ""}, Singapore{" "}
              {order.shippingPostalCode}
            </p>
            {order.landmark && <p>Landmark: {order.landmark}</p>}
            <p>
              Delivery Date:{" "}
              {order.deliveryDate
                ? new Date(order.deliveryDate).toLocaleDateString("en-SG", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Not specified"}
            </p>
            {order.orderNotes && <p>Notes: {order.orderNotes}</p>}
          </dl>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-dark-green">
            Payment
          </h3>
          <p className="mt-3 text-sm text-gray-600">
            Method: {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Subtotal</dt>
              <dd className="font-medium text-gray-900">{formatPrice(order.subtotal)}</dd>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between">
                <dt className="text-gray-500">
                  Discount{order.couponCode ? ` (${order.couponCode})` : ""}
                </dt>
                <dd className="font-medium text-sale-red">-{formatPrice(order.discountAmount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-100 pt-2">
              <dt className="text-gray-500">Delivery Fee</dt>
              <dd className="font-medium text-gray-900">
                {order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base">
              <dt className="font-bold text-dark-green">Total</dt>
              <dd className="font-bold text-dark-green">{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
