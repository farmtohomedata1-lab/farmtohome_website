import "server-only";

// Shared by every feature that sends mail via Resend (order alerts, the
// contact form) so the "from" address and the shop owner's inbox are
// defined in exactly one place. Reuses the existing ORDER_* env vars rather
// than introducing new ones — same inbox, multiple senders.
export const EMAIL_FROM_ADDRESS =
  process.env.ORDER_EMAIL_FROM || "Farm To Home <onboarding@resend.dev>";
export const SHOP_ALERT_EMAIL = process.env.ORDER_ALERT_EMAIL;

// Where contact-form submissions are sent — deliberately separate from
// ORDER_ALERT_EMAIL (order alerts and contact messages can go to different
// inboxes/people). Comma-separated so more recipients can be added later
// without a code change.
export const CONTACT_NOTIFY_EMAILS = (process.env.CONTACT_NOTIFY_EMAILS || "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);
