"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkLoginAllowed, recordFailedLogin } from "@/lib/auth/rateLimit";
import { getClientIp } from "@/lib/auth/getClientIp";
import { sendCustomerPasswordResetLinkEmail } from "@/lib/email/securityAlertEmail";

export interface ForgotPasswordState {
  status?: "sent" | "error";
  error?: string;
}

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return { status: "error", error: "Enter a valid email address." };
  }

  // Rate limit per IP. The anon resetPasswordForEmail() this replaced went
  // through Supabase's own recover rate limit; the service-role generateLink()
  // below does not, so we add our own here (reusing the shared limiter) to
  // stop this being abused to spam reset emails at a customer's inbox.
  const rateLimitKey = `customer-reset:${await getClientIp()}`;
  const gate = await checkLoginAllowed(rateLimitKey);
  if (!gate.allowed) {
    const minutes = Math.ceil(gate.retryAfterSeconds / 60);
    return {
      status: "error",
      error: `Too many reset requests. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }
  await recordFailedLogin(rateLimitKey);

  const headersList = await headers();
  const origin = headersList.get("origin") ?? `https://${headersList.get("host")}`;

  // Mint the recovery link with the service-role admin API (which bypasses the
  // Supabase CAPTCHA gate that blocks the anon /auth/v1/recover endpoint) and
  // deliver it via our own Resend — same reliable path as the admin reset
  // flow. generateLink errors for an email with no account; we swallow that
  // and return the same generic response either way, so this never reveals
  // whether an account exists (no enumeration oracle).
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email });
    const tokenHash = data?.properties?.hashed_token;
    if (error || !tokenHash) {
      // Most commonly "user not found" — deliberately not surfaced. Only log
      // genuinely unexpected failures.
      if (error && !/not found|no user|does not exist/i.test(error.message)) {
        console.error("[forgot-password] generateLink failed:", error);
      }
    } else {
      const resetUrl = `${origin}/reset-password/confirm?token_hash=${tokenHash}&type=recovery`;
      await sendCustomerPasswordResetLinkEmail(email, resetUrl);
    }
  } catch (err) {
    console.error("[forgot-password] reset link generation threw:", err);
  }

  // Always the same generic response — never reveals whether the email exists.
  return { status: "sent" };
}
