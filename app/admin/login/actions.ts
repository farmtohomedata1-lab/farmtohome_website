"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkLoginAllowed, clearLoginAttempts, recordFailedLogin } from "@/lib/auth/rateLimit";

export interface LoginState {
  error?: string;
}

export async function signIn(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

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
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    await recordFailedLogin(rateLimitKey);
    return { error: "Invalid email or password." };
  }

  await clearLoginAttempts(rateLimitKey);
  redirect("/admin/cms");
}
