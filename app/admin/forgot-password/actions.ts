"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/adminAllowlist";
import { checkLoginAllowed, recordFailedLogin } from "@/lib/auth/rateLimit";
import { getClientIp } from "@/lib/auth/getClientIp";
import { sendAdminPasswordResetRequestedEmail } from "@/lib/email/securityAlertEmail";

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

  // Only a genuine admin email gets an alert AND an actual Supabase reset
  // link. A non-admin email gets nothing sent — but the RESPONSE below is
  // identical either way, so this endpoint never reveals whether the entered
  // email is the real admin address (no enumeration oracle).
  if (isAdminEmail(email)) {
    // Fires on the REQUEST itself, before any reset can complete, so an
    // attempted takeover is visible to the admin even if it ultimately fails.
    await sendAdminPasswordResetRequestedEmail(email);

    const headersList = await headers();
    const origin = headersList.get("origin") ?? `https://${headersList.get("host")}`;
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/admin/reset-password/confirm`,
    });
    if (error) {
      console.error("[admin/forgot-password] resetPasswordForEmail failed:", error);
    }
  }

  return { status: "sent" };
}
