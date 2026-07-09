// Shared display formatting — single source of truth so every product price
// on the site (homepage sections, admin lists, /shop) renders identically.

export function formatPrice(amount: number): string {
  return `S$${amount.toFixed(2)}`;
}

// Every customer/order-facing date is shown in Singapore local time,
// regardless of what timezone the server (Vercel runs UTC) or the viewer's
// browser is in. The "en-SG" locale alone only controls formatting
// conventions (date order, month names) — it does NOT convert the
// timezone, which is exactly what caused admin/email timestamps to render
// up to 8 hours off before every call here explicitly passed `timeZone`.
const SGT_TIMEZONE = "Asia/Singapore";

export function formatDateSGT(date: Date | string, monthStyle: "short" | "long" = "long"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-SG", {
    day: "numeric",
    month: monthStyle,
    year: "numeric",
    timeZone: SGT_TIMEZONE,
  });
}

export function formatDateTimeSGT(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const timePart = d.toLocaleTimeString("en-SG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: SGT_TIMEZONE,
  });
  return `${formatDateSGT(d, "long")}, ${timePart}`;
}
