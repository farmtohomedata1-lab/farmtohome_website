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
  if (key.startsWith("admin-reset:")) return `admin password-reset requests from IP ${key.slice("admin-reset:".length)}`;
  if (key.startsWith("admin:")) return `admin login attempts for ${key.slice("admin:".length)}`;
  return `login attempts for ${key}`;
}

function describeLockoutKind(key: string): string {
  if (key.startsWith("signup:")) return "signup";
  if (key.startsWith("coupon:")) return "coupon";
  if (key.startsWith("admin-reset:")) return "admin password-reset";
  if (key.startsWith("admin:")) return "admin login";
  return "login";
}

// Sent to the admin's OWN inbox when a password reset is requested — and it
// carries the actual reset LINK. The link's token is minted by the
// service-role admin API (lib/supabase/admin.ts's generateLink), NOT by the
// anon resetPasswordForEmail() call, which is why this works even while
// Supabase CAPTCHA protection is enabled (captcha only gates the public anon
// endpoints; the service-role admin API bypasses it). Delivered via our own
// Resend, so it also doesn't depend on Supabase's SMTP. Best-effort (never
// throws): a failed send must not break the request handler.
export async function sendAdminPasswordResetLinkEmail(
  adminEmail: string,
  resetUrl: string
): Promise<void> {
  const client = getResendClient();
  if (!client) {
    console.warn("[email] Skipping admin reset-link email — Resend not configured.");
    return;
  }
  try {
    const { data, error } = await client.emails.send({
      from: EMAIL_FROM_ADDRESS,
      to: adminEmail,
      subject: "Reset your Farm To Home admin password",
      html: `
        <p>A password reset was requested for your Farm To Home admin account (${escapeHtml(adminEmail)}).</p>
        <p style="margin:20px 0">
          <a href="${escapeHtml(resetUrl)}" style="background:#629d23;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600">Set a new password</a>
        </p>
        <p>Or paste this link into your browser:<br><span style="word-break:break-all">${escapeHtml(resetUrl)}</span></p>
        <p style="color:#555;font-size:13px">This link is single-use and expires shortly. <strong>If you didn't request this</strong>, you can safely ignore this email — your password will not change unless you open the link and set a new one. You'll also get a separate confirmation email if a change actually goes through.</p>
      `,
    });
    if (error) {
      console.error("[email] sendAdminPasswordResetLinkEmail rejected by Resend:", JSON.stringify(error));
      return;
    }
    console.log(`[email] sendAdminPasswordResetLinkEmail sent, Resend id=${data?.id}`);
  } catch (err) {
    console.error("[email] sendAdminPasswordResetLinkEmail threw:", err);
  }
}

// Sent to the admin's OWN inbox once the password has ACTUALLY been changed —
// the second, distinct signal so a real admin can tell "someone tried" (the
// requested email above) apart from "someone succeeded" (this one).
export async function sendAdminPasswordResetCompletedEmail(adminEmail: string): Promise<void> {
  const client = getResendClient();
  if (!client) {
    console.warn("[email] Skipping admin reset-completed alert — Resend not configured.");
    return;
  }
  try {
    const { data, error } = await client.emails.send({
      from: EMAIL_FROM_ADDRESS,
      to: adminEmail,
      subject: "Security alert: your admin account password was just changed",
      html: `
        <p>The password for your Farm To Home admin account (${escapeHtml(adminEmail)}) was just <strong>changed successfully</strong>.</p>
        <p>If this was you, no action is needed. <strong>If this wasn't you</strong>, your admin account may be compromised — request a new reset immediately to lock whoever did this out, and review recent activity in the admin activity log.</p>
      `,
    });
    if (error) {
      console.error("[email] sendAdminPasswordResetCompletedEmail rejected by Resend:", JSON.stringify(error));
      return;
    }
    console.log(`[email] sendAdminPasswordResetCompletedEmail sent, Resend id=${data?.id}`);
  } catch (err) {
    console.error("[email] sendAdminPasswordResetCompletedEmail threw:", err);
  }
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
