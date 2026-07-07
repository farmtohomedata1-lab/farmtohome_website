import "server-only";

// Shared by every email template that interpolates customer-typed text
// (order emails, contact form) into a raw HTML string — unlike JSX, which
// auto-escapes, `client.emails.send({ html })` does not, so anything
// attacker/customer-controlled must be escaped by hand before interpolation
// or it renders as live markup in the recipient's inbox.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
