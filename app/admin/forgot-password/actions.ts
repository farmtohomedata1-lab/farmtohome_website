"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/auth/adminAllowlist";
import { checkLoginAllowed, recordFailedLogin } from "@/lib/auth/rateLimit";
import { getClientIp } from "@/lib/auth/getClientIp";
import { sendAdminPasswordResetLinkEmail } from "@/lib/email/securityAlertEmail";

export interface AdminForgotState {
  status?: "sent" | "error";
  error?: string;
}

// Stricter than the customer reset (which has no per-request cap of its own):
// 3 requests / hour, keyed per IP, reusing the shared rate-limit table with a
// dedicated "admin-reset:" prefix rather than a second system.
const MAX_RESET_REQUESTS = 3;
const RESET_WINDOW_MINUTES = 60;

export async function requestAdminPasswordReset(
  _prevState: AdminForgotState,
  formData: FormData
): Promise<AdminForgotState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { status: "error", error: "Enter a valid email address." };
  }

  const rateLimitKey = `admin-reset:${await getClientIp()}`;
  const gate = await checkLoginAllowed(rateLimitKey);
  if (!gate.allowed) {
    const minutes = Math.ceil(gate.retryAfterSeconds / 60);
    return {
      status: "error",
      error: `Too many reset requests. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }
  // Count this request toward the 3/hour cap. Never cleared on "success" (same
  // inverted use as signup) — only the 60-minute window resets it — so an
  // attacker can't flood the admin's inbox with more than 3 alerts an hour.
  await recordFailedLogin(rateLimitKey, {
    maxAttempts: MAX_RESET_REQUESTS,
    lockoutMinutes: RESET_WINDOW_MINUTES,
  });

  // Only a genuine admin email gets a real reset link emailed to it. A
  // non-admin email gets nothing sent — but the RESPONSE below is identical
  // either way, so this endpoint never reveals whether the entered email is
  // the real admin address (no enumeration oracle).
  //
  // The recovery token is minted with the SERVICE-ROLE admin API
  // (generateLink), NOT the anon resetPasswordForEmail(). This is deliberate
  // and load-bearing: the anon /auth/v1/recover endpoint is gated by Supabase
  // CAPTCHA protection and returns 400 `captcha_failed` without a captcha
  // token (which this server action has no way to obtain) — the exact failure
  // that broke this flow. The service-role admin API bypasses that gate. We
  // then build the reset URL against OUR OWN confirm route and email it via
  // OUR OWN Resend, so this flow depends on neither Supabase captcha, Supabase
  // SMTP, nor the Supabase "Redirect URLs" allowlist.
  if (isAdminEmail(email)) {
    try {
      const headersList = await headers();
      const origin = headersList.get("origin") ?? `https://${headersList.get("host")}`;
      const admin = createAdminClient();
      const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email });
      const tokenHash = data?.properties?.hashed_token;
      if (error || !tokenHash) {
        console.error("[admin/forgot-password] generateLink failed:", error);
      } else {
        // Our confirm route (app/admin/reset-password/confirm) verifies this
        // token_hash via verifyOtp — which is NOT captcha-gated — then sets
        // the admin recovery session and sends the admin to set a new password.
        const resetUrl = `${origin}/admin/reset-password/confirm?token_hash=${tokenHash}&type=recovery`;
        await sendAdminPasswordResetLinkEmail(email, resetUrl);
      }
    } catch (err) {
      console.error("[admin/forgot-password] reset link generation threw:", err);
    }
  }

  return { status: "sent" };
}
