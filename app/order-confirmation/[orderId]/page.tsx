import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteHeader from "@/components/home/SiteHeader";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";
import PageHero from "@/components/common/PageHero";
import OrderSummaryView from "@/components/orders/OrderSummaryView";
import PayNowPanel from "@/components/orders/PayNowPanel";
import StripeConfirmationStatus from "@/components/orders/StripeConfirmationStatus";
import SuccessCheckmark from "@/components/orders/SuccessCheckmark";
import { requireAuthedCustomer } from "@/lib/auth/customerSession";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Order Confirmation | Farm To Home",
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const customer = await requireAuthedCustomer(`/order-confirmation/${orderId}`);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  // The actual security boundary: a missing order and someone else's order
  // must be indistinguishable from this page's response. There is no
  // DB-level RLS backing this (see prisma/schema.prisma's Order comment) —
  // this explicit check is what prevents one customer from viewing another
  // customer's order by guessing/editing the id in the URL.
  if (!order || order.customerId !== customer.id) {
    notFound();
  }

  const settings =
    order.paymentMethod === "PAYNOW_MANUAL" ? await prisma.siteSettings.findFirst() : null;

  // For a Stripe order, "placed" and "paid" are different things — the
  // webhook is the only thing that ever confirms the latter, so the success
  // banner only shows once paymentStatus is genuinely PAID. PayNow keeps
  // showing it immediately, unchanged: placing a PayNow order always
  // succeeds regardless of when (or whether) the customer actually pays.
  const isUnconfirmedStripeOrder = order.paymentMethod === "STRIPE" && order.paymentStatus !== "PAID";

  return (
    <>
      <SiteHeader />
      <NavBar />
      <main>
        <PageHero heading="Order Confirmation" breadcrumbLabel="Order Confirmation" />
        <div className="mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-6">
          {isUnconfirmedStripeOrder ? (
            <div className="mb-6">
              <StripeConfirmationStatus
                orderId={order.id}
                initialPaymentStatus={order.paymentStatus}
                total={order.total.toNumber()}
              />
            </div>
          ) : (
            <div className="mb-6 flex flex-col items-center gap-3 rounded-md bg-brand-green/10 px-4 py-6 text-center sm:flex-row sm:justify-center">
              <SuccessCheckmark />
              <p className="text-sm text-dark-green">
                Thank you! Your order <strong>#{order.id.slice(-8).toUpperCase()}</strong> has been
                placed.
              </p>
            </div>
          )}

          <div className="lg:flex lg:items-start lg:gap-8">
            <div className="min-w-0 flex-1">
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
                  taxAmount: order.taxAmount.toNumber(),
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

            {order.paymentMethod === "PAYNOW_MANUAL" && (
              <div className="mt-8 w-full shrink-0 lg:mt-0 lg:w-80">
                <PayNowPanel
                  orderId={order.id}
                  total={order.total.toNumber()}
                  qrImageUrl={settings?.paynowQrImageUrl ?? null}
                  paymentStatus={order.paymentStatus}
                  customerDeclaredPaid={order.customerDeclaredPaid}
                />
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
