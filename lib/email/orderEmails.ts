import "server-only";
import { prisma } from "@/lib/prisma";
import { formatDateSGT, formatDateTimeSGT, formatPrice } from "@/lib/format";
import { getResendClient } from "./resend";
import { EMAIL_FROM_ADDRESS, SHOP_ALERT_EMAIL } from "./config";
import { escapeHtml } from "./escapeHtml";
import { PAYMENT_METHOD_LABELS } from "@/lib/orderPaymentLabels";

async function loadOrderForEmail(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, customer: true },
  });
}

type OrderForEmail = NonNullable<Awaited<ReturnType<typeof loadOrderForEmail>>>;

// Brand palette, matching app/globals.css @theme -- kept as literal hex here
// rather than imported, since email HTML can't reference CSS custom
// properties (no shared stylesheet reaches an inbox).
const BRAND_GREEN = "#629d23";
const DARK_GREEN = "#2c3c28";
const CREAM = "#f5f0e3";
const BORDER = "#e2ddce";
const TEXT_MUTED = "#6b7280";

// Table-based layout with every style inline: the only markup that renders
// consistently across real inboxes (Gmail, Outlook, Apple Mail strip or
// ignore <style> blocks and flexbox/grid to wildly varying degrees) is
// <table>-based HTML with inline `style` attributes on every element.
function renderEmailShell(params: { preheader: string; bodyHtml: string }): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Farm To Home</title>
  </head>
  <body style="margin:0;padding:0;background:${CREAM};font-family:Arial,Helvetica,sans-serif;">
    <!-- Preheader: shown as inbox preview text, hidden in the rendered body -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(params.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid ${BORDER};">
            <tr>
              <td style="background:${DARK_GREEN};padding:20px 28px;">
                <span style="font-size:18px;font-weight:bold;color:#ffffff;letter-spacing:0.3px;">Farm To Home</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                ${params.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="background:${CREAM};padding:18px 28px;border-top:1px solid ${BORDER};">
                <p style="margin:0;font-size:12px;color:${TEXT_MUTED};line-height:1.6;">
                  Farm To Home &mdash; fresh groceries delivered across Singapore.<br />
                  This is an automated order notification.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// Every value below came from a checkout form (or, for item names, the
// admin product catalog) and gets interpolated into a raw HTML string sent
// through Resend — unlike JSX this does not auto-escape, so anything
// customer-typed (name, phone, address, coupon code) must be escaped by
// hand or a crafted checkout submission could inject markup into the shop
// owner's inbox.
function renderOrderSummaryHtml(order: OrderForEmail): string {
  const itemRows = order.items
    .map(
      (item, i) => `<tr style="${i % 2 === 1 ? `background:${CREAM};` : ""}">
        <td style="padding:10px 12px;font-size:13px;color:${DARK_GREEN};border-bottom:1px solid ${BORDER};">${escapeHtml(item.name)}</td>
        <td style="padding:10px 12px;font-size:13px;color:${TEXT_MUTED};text-align:center;border-bottom:1px solid ${BORDER};">${item.quantity}</td>
        <td style="padding:10px 12px;font-size:13px;color:${TEXT_MUTED};text-align:right;border-bottom:1px solid ${BORDER};">${formatPrice(item.price.toNumber())}</td>
        <td style="padding:10px 12px;font-size:13px;font-weight:bold;color:${DARK_GREEN};text-align:right;border-bottom:1px solid ${BORDER};">${formatPrice(item.price.toNumber() * item.quantity)}</td>
      </tr>`
    )
    .join("");

  const deliveryDateText = order.deliveryDate ? formatDateSGT(order.deliveryDate, "long") : "Not specified";
  const addressLine = `${order.shippingBlockStreet}${order.shippingUnitNumber ? `, ${order.shippingUnitNumber}` : ""}, Singapore ${order.shippingPostalCode}`;

  const totalsRow = (label: string, value: string, opts?: { emphasis?: boolean; negative?: boolean }) => `
    <tr>
      <td style="padding:4px 0;font-size:${opts?.emphasis ? "15px" : "13px"};color:${opts?.emphasis ? DARK_GREEN : TEXT_MUTED};font-weight:${opts?.emphasis ? "bold" : "normal"};">${label}</td>
      <td style="padding:4px 0;font-size:${opts?.emphasis ? "15px" : "13px"};color:${opts?.negative ? BRAND_GREEN : opts?.emphasis ? DARK_GREEN : "#111827"};font-weight:${opts?.emphasis ? "bold" : "600"};text-align:right;">${value}</td>
    </tr>`;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
      <tr>
        <td>
          <span style="display:inline-block;background:${BRAND_GREEN};color:#ffffff;font-size:11px;font-weight:bold;letter-spacing:0.4px;text-transform:uppercase;padding:4px 10px;border-radius:4px;">
            Order #${order.id.slice(-8).toUpperCase()}
          </span>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td width="50%" style="font-size:13px;color:${TEXT_MUTED};vertical-align:top;padding-right:12px;">
          <strong style="color:${DARK_GREEN};">Deliver to</strong><br />
          ${escapeHtml(order.shippingFullName)}<br />
          ${escapeHtml(order.shippingPhone)}<br />
          ${escapeHtml(addressLine)}
        </td>
        <td width="50%" style="font-size:13px;color:${TEXT_MUTED};vertical-align:top;">
          <strong style="color:${DARK_GREEN};">Order details</strong><br />
          Placed: ${formatDateTimeSGT(order.createdAt)}<br />
          Delivery date: ${escapeHtml(deliveryDateText)}<br />
          Payment: ${escapeHtml(PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod)}
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:6px;overflow:hidden;margin-bottom:20px;">
      <thead>
        <tr style="background:${DARK_GREEN};">
          <th align="left" style="padding:8px 12px;font-size:11px;color:#ffffff;text-transform:uppercase;letter-spacing:0.3px;">Item</th>
          <th align="center" style="padding:8px 12px;font-size:11px;color:#ffffff;text-transform:uppercase;letter-spacing:0.3px;">Qty</th>
          <th align="right" style="padding:8px 12px;font-size:11px;color:#ffffff;text-transform:uppercase;letter-spacing:0.3px;">Price</th>
          <th align="right" style="padding:8px 12px;font-size:11px;color:#ffffff;text-transform:uppercase;letter-spacing:0.3px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:4px;">
      ${totalsRow("Subtotal", formatPrice(order.subtotal.toNumber()))}
      ${
        order.discountAmount.toNumber() > 0
          ? totalsRow(
              `Discount${order.couponCode ? ` (${escapeHtml(order.couponCode)})` : ""}`,
              `-${formatPrice(order.discountAmount.toNumber())}`,
              { negative: true }
            )
          : ""
      }
      ${totalsRow("Delivery Fee", order.shippingFee.toNumber() === 0 ? "Free" : formatPrice(order.shippingFee.toNumber()))}
      ${order.taxAmount.toNumber() > 0 ? totalsRow("Tax", formatPrice(order.taxAmount.toNumber())) : ""}
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid ${DARK_GREEN};padding-top:6px;">
      ${totalsRow("Total", formatPrice(order.total.toNumber()), { emphasis: true })}
    </table>
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

    const html = renderEmailShell({
      preheader: `Thanks for your order #${order.id.slice(-8).toUpperCase()} — total ${formatPrice(order.total.toNumber())}`,
      bodyHtml: `
        <h1 style="margin:0 0 6px;font-size:20px;color:${DARK_GREEN};">Thanks for your order!</h1>
        <p style="margin:0 0 20px;font-size:14px;color:${TEXT_MUTED};line-height:1.6;">
          We've received your order and we're getting it ready. Here's your summary:
        </p>
        ${renderOrderSummaryHtml(order)}
      `,
    });

    const { data, error } = await client.emails.send({
      from: EMAIL_FROM_ADDRESS,
      to: order.email,
      subject: `Order Confirmed — #${order.id.slice(-8).toUpperCase()}`,
      html,
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

    const html = renderEmailShell({
      preheader: `New order #${order.id.slice(-8).toUpperCase()} from ${order.customer.email} — ${formatPrice(order.total.toNumber())}`,
      bodyHtml: `
        <h1 style="margin:0 0 6px;font-size:20px;color:${DARK_GREEN};">New order received</h1>
        <p style="margin:0 0 20px;font-size:14px;color:${TEXT_MUTED};line-height:1.6;">
          From <strong style="color:${DARK_GREEN};">${escapeHtml(order.customer.email)}</strong>
        </p>
        ${renderOrderSummaryHtml(order)}
      `,
    });

    const { data, error } = await client.emails.send({
      from: EMAIL_FROM_ADDRESS,
      to: SHOP_ALERT_EMAIL,
      subject: `New Order — #${order.id.slice(-8).toUpperCase()}`,
      html,
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
