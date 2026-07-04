"use server";

import { redirect } from "next/navigation";
import { createCustomerClient } from "@/lib/supabase/customerServer";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";
import { safeRedirect } from "@/lib/auth/safeRedirect";
import { checkLoginAllowed, clearLoginAttempts, recordFailedLogin } from "@/lib/auth/rateLimit";

export interface LoginState {
  error?: string;
}

const MIN_PASSWORD_LENGTH = 8;

async function upsertCustomer(user: { id: string; email?: string }): Promise<void> {
  if (!user.email) return;
  await prisma.customer.upsert({
    where: { supabaseUserId: user.id },
    create: { supabaseUserId: user.id, email: user.email },
    update: { email: user.email },
  });
}

// One form, one button — login and signup are the same action. Order:
// 1. Try signing in. 2. If that fails, check OUR OWN Customer table (kept in
// sync on every successful login/signup here) to tell "wrong password" apart
// from "no account yet" — Supabase's signInWithPassword deliberately returns
// the same generic error for both cases, to prevent account enumeration via
// the sign-in endpoint itself, so it can't tell us which case we're in.
// 3. No existing account -> create one via the admin API (email_confirm:
// true, so there's no email-verification step) and sign in for real.
export async function continueWithPassword(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const redirectTo = safeRedirect(String(formData.get("redirectTo") || ""), "/account");

  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }

  // Checked before ever touching Supabase Auth, mirroring the admin login's
  // brute-force protection (lib/auth/rateLimit.ts) — a locked-out email
  // can't be used to keep guessing passwords against an existing account.
  const gate = await checkLoginAllowed(email);
  if (!gate.allowed) {
    const minutes = Math.ceil(gate.retryAfterSeconds / 60);
    return {
      error: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  const supabase = await createCustomerClient();
  const signInResult = await supabase.auth.signInWithPassword({ email, password });

  if (signInResult.data.user) {
    await clearLoginAttempts(email);
    await upsertCustomer(signInResult.data.user);
    redirect(redirectTo);
  }

  const existingCustomer = await prisma.customer.findUnique({ where: { email } });
  if (existingCustomer) {
    await recordFailedLogin(email);
    return { error: "Incorrect password." };
  }

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    // Edge case: a Supabase Auth user exists for this email but our Customer
    // table never learned about it — fall back to the same message rather
    // than revealing that distinction.
    if (createError?.message?.toLowerCase().includes("already")) {
      return { error: "Incorrect password." };
    }
    console.error("[login] createUser failed:", createError);
    return { error: "Couldn't create your account. Please try again." };
  }

  const secondSignIn = await supabase.auth.signInWithPassword({ email, password });
  if (!secondSignIn.data.user) {
    console.error("[login] post-signup sign-in failed:", secondSignIn.error);
    return { error: "Account created, but sign-in failed. Please try logging in again." };
  }

  await upsertCustomer(secondSignIn.data.user);
  redirect(redirectTo);
}
