"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/adminAllowlist";
import { checkLoginAllowed, clearLoginAttempts, recordFailedLogin } from "@/lib/auth/rateLimit";

export interface LoginState {
  error?: string;
}

export async function signIn(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  // Cloudflare Turnstile token from the login form. Only ever non-empty once
  // NEXT_PUBLIC_TURNSTILE_SITE_KEY is configured (the widget renders nothing
  // otherwise), and Supabase only enforces it when CAPTCHA protection is
  // enabled in the dashboard — so this stays inert until both are wired.
  const turnstileToken = String(formData.get("turnstileToken") || "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  // Prefixed so this can never share a lockout with the customer-facing
  // login at app/login/actions.ts — without this, someone could fail
  // customer login 5x for the admin's own email (a public, unauthenticated
  // form) and lock the admin out of /admin/login for 15 minutes, repeatedly,
  // since both previously checked the bare email against the same
  // LoginAttempt row. Same prefixing pattern as the "coupon:"/"signup:" keys
  // elsewhere in this table.
  const rateLimitKey = `admin:${email}`;

  // Checked before ever touching Supabase Auth, so a locked-out account
  // can't be used to keep guessing passwords.
  const gate = await checkLoginAllowed(rateLimitKey);
  if (!gate.allowed) {
    const minutes = Math.ceil(gate.retryAfterSeconds / 60);
    return {
      error: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: turnstileToken ? { captchaToken: turnstileToken } : undefined,
  });

  if (error || !data.user) {
    await recordFailedLogin(rateLimitKey);
    return { error: "Invalid email or password." };
  }

  // Authentication succeeded, but that only proves this is a real Supabase
  // user — and customers are real Supabase users in this same project. Reject
  // anyone not on the admin allowlist, clearing the session cookie that
  // signInWithPassword just set. Same generic error and a recorded failed
  // attempt as a wrong password, so a customer can't distinguish "valid
  // credentials but not an admin" from "wrong password" here.
  if (!isAdminEmail(data.user.email)) {
    await supabase.auth.signOut();
    await recordFailedLogin(rateLimitKey);
    return { error: "Invalid email or password." };
  }

  await clearLoginAttempts(rateLimitKey);
  redirect("/admin/cms");
}
