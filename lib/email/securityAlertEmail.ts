import "server-only";
import { getResendClient } from "./resend";
import { EMAIL_FROM_ADDRESS, SHOP_ALERT_EMAIL } from "./config";
import { escapeHtml } from "./escapeHtml";

// lib/auth/rateLimit.ts reuses one LoginAttempt table for three different
// abuse patterns, distinguished only by the key's prefix (see that file) —
// this turns the raw key back into a human-readable description for the
// alert email, rather than the shop owner having to know that convention.
function describeLockoutTarget(key: string): string {
  if (key.startsWith("signup:")) return `signup attempts from IP ${key.slice("signup:".length)}`;
  if (key.startsWith("coupon:")) return `coupon-code attempts from IP ${key.slice("coupon:".length)}`;
  return `login attempts for ${key}`;
}

function describeLockoutKind(key: string): string {
  if (key.startsWith("signup:")) return "signup";
  if (key.startsWith("coupon:")) return "coupon";
  return "login";
}

// Fired exactly once per lockout (see the justLockedOut check in
// recordFailedLogin) — never on every subsequent blocked attempt during the
// same 15-minute window, so this can't turn into an inbox flood. Best-effort:
// never throws, since a notification failing must never affect the lockout
// itself (which has already been recorded by the time this is called).
export async function sendLockoutAlertEmail(key: string, failedCount: number): Promise<void> {
  const client = getResendClient();
  if (!client || !SHOP_ALERT_EMAIL) {
    console.warn("[email] Skipping lockout alert email — Resend or ORDER_ALERT_EMAIL not configured.");
    return;
  }

  const target = describeLockoutTarget(key);
  const kind = describeLockoutKind(key);

  try {
    const { data, error } = await client.emails.send({
      from: EMAIL_FROM_ADDRESS,
      to: SHOP_ALERT_EMAIL,
      subject: `Security alert: repeated failed ${kind} attempts triggered a lockout`,
      html: `
        <p><strong>${failedCount} failed attempts</strong> triggered a 15-minute lockout for ${escapeHtml(target)}.</p>
        <p>This is an automated brute-force protection alert from the rate limiter already in place — no action is needed unless this doesn't look like normal activity to you.</p>
      `,
    });

    if (error) {
      console.error("[email] sendLockoutAlertEmail rejected by Resend:", JSON.stringify(error));
      return;
    }
    console.log(`[email] sendLockoutAlertEmail sent, Resend id=${data?.id}`);
  } catch (err) {
    console.error("[email] sendLockoutAlertEmail threw:", err);
  }
}
