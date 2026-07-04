import "server-only";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { getResendClient } from "./resend";
import { EMAIL_FROM_ADDRESS, SHOP_ALERT_EMAIL } from "./config";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: "Cash on Delivery",
  PAYNOW_MANUAL: "PayNow",
};

async function loadOrderForEmail(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, customer: true },
  });
}

type OrderForEmail = NonNullable<Awaited<ReturnType<typeof loadOrderForEmail>>>;

// e.g. "4 July 2026, 8:38 PM" — the exact real order.createdAt timestamp,
// not just the date, so both emails show precisely when the order landed.
function formatOrderDateTime(date: Date): string {
  const datePart = date.toLocaleDateString("en-SG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-SG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart}, ${timePart}`;
}

function renderOrderSummaryHtml(order: OrderForEmail): string {
  const itemsHtml = order.items
    .map(
      (item) => `<tr>
        <td style="padding:4px 8px">${item.name}</td>
        <td style="padding:4px 8px">${item.quantity}</td>
        <td style="padding:4px 8px">${formatPrice(item.price.toNumber())}</td>
        <td style="padding:4px 8px">${formatPrice(item.price.toNumber() * item.quantity)}</td>
      </tr>`
    )
    .join("");

  const deliveryDateText = order.deliveryDate
    ? new Date(order.deliveryDate).toLocaleDateString("en-SG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Not specified";

  return `
    <h2>Order #${order.id.slice(-8).toUpperCase()}</h2>
    <p><strong>Name:</strong> ${order.shippingFullName}</p>
    <p><strong>Phone:</strong> ${order.shippingPhone}</p>
    <p><strong>Order Placed:</strong> ${formatOrderDateTime(order.createdAt)}</p>
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%">
      <thead>
        <tr>
          <th align="left" style="padding:4px 8px">Item</th>
          <th align="left" style="padding:4px 8px">Qty</th>
          <th align="left" style="padding:4px 8px">Price</th>
          <th align="left" style="padding:4px 8px">Subtotal</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <p>Subtotal: ${formatPrice(order.subtotal.toNumber())}</p>
    ${
      order.discountAmount.toNumber() > 0
        ? `<p>Discount${order.couponCode ? ` (${order.couponCode})` : ""}: -${formatPrice(order.discountAmount.toNumber())}</p>`
        : ""
    }
    <p>Delivery Fee: ${
      order.shippingFee.toNumber() === 0 ? "Free" : formatPrice(order.shippingFee.toNumber())
    }</p>
    <p><strong>Total: ${formatPrice(order.total.toNumber())}</strong></p>
    <p>Payment Method: ${PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</p>
    <p>Delivery Date: ${deliveryDateText}</p>
    <p>Delivering to: ${order.shippingBlockStreet}${
      order.shippingUnitNumber ? `, ${order.shippingUnitNumber}` : ""
    }, Singapore ${order.shippingPostalCode}</p>
  `;
}

// Both functions below catch/log every failure internally and never throw —
// a customer's order must never fail to place just because an email
// couldn't be sent.
//
// IMPORTANT: the Resend SDK does NOT throw on an API-level failure (bad
// recipient, sandbox restriction, unverified domain, etc.) — `emails.send()`
// resolves successfully either way and returns a `{ data, error }` union.
// The bug that made emails "fail silently" was exactly this: earlier code
// awaited the call and never looked at `.error`, so a rejected send looked
// identical to a successful one from here. Every call below now explicitly
// checks and logs `.error`.

export async function sendOrderConfirmationEmail(orderId: string): Promise<void> {
  const client = getResendClient();
  if (!client) return;

  try {
    const order = await loadOrderForEmail(orderId);
    if (!order) return;

    const { data, error } = await client.emails.send({
      from: EMAIL_FROM_ADDRESS,
      to: order.email,
      subject: `Order Confirmed — #${order.id.slice(-8).toUpperCase()}`,
      html: `<p>Thanks for your order! Here's your summary:</p>${renderOrderSummaryHtml(order)}`,
    });

    if (error) {
      console.error(
        `[email] sendOrderConfirmationEmail(${orderId}) rejected by Resend:`,
        JSON.stringify(error)
      );
      return;
    }
    console.log(`[email] sendOrderConfirmationEmail(${orderId}) sent, Resend id=${data?.id}`);
  } catch (err) {
    console.error(`[email] sendOrderConfirmationEmail(${orderId}) threw:`, err);
  }
}

export async function sendOrderAlertEmail(orderId: string): Promise<void> {
  const client = getResendClient();
  if (!client) return;
  if (!SHOP_ALERT_EMAIL) {
    console.warn("[email] ORDER_ALERT_EMAIL is not set — skipping shop owner alert.");
    return;
  }

  try {
    const order = await loadOrderForEmail(orderId);
    if (!order) return;

    const { data, error } = await client.emails.send({
      from: EMAIL_FROM_ADDRESS,
      to: SHOP_ALERT_EMAIL,
      subject: `New Order — #${order.id.slice(-8).toUpperCase()}`,
      html: `<p>New order from ${order.customer.email}:</p>${renderOrderSummaryHtml(order)}`,
    });

    if (error) {
      console.error(
        `[email] sendOrderAlertEmail(${orderId}) rejected by Resend:`,
        JSON.stringify(error)
      );
      return;
    }
    console.log(`[email] sendOrderAlertEmail(${orderId}) sent, Resend id=${data?.id}`);
  } catch (err) {
    console.error(`[email] sendOrderAlertEmail(${orderId}) threw:`, err);
  }
}
