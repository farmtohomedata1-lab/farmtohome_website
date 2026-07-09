"use server";

import { redirect } from "next/navigation";
import { createCustomerClient } from "@/lib/supabase/customerServer";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";
import { safeRedirect } from "@/lib/auth/safeRedirect";
import { checkLoginAllowed, clearLoginAttempts, recordFailedLogin } from "@/lib/auth/rateLimit";
import { getClientIp } from "@/lib/auth/getClientIp";

export interface LoginState {
  error?: string;
  // Set when this email has no existing account — tells the client to reveal
  // the Confirm Password field and switch into "create your account" framing.
  // Echoes back the email it applies to so the client can tell if the
  // visitor has since edited the email away from what was checked (in which
  // case the client re-hides the field itself, no server round-trip needed).
  needsAccountCreation?: boolean;
  checkedEmail?: string;
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

// Two-step flow, one action, one Customer table as the source of truth:
// 1. Try signing in with whatever was submitted.
// 2. If that fails, check OUR OWN Customer table (kept in sync on every
//    successful login/signup here) to tell "wrong password" apart from "no
//    account yet" — Supabase's signInWithPassword deliberately returns the
//    same generic error for both, so we still have to ask ourselves, not
//    Supabase, which case this is.
// 3a. Existing account, wrong password -> "Incorrect password.", full stop.
// 3b. No account yet, first time we're seeing this email (no confirmPassword
//     submitted) -> don't create anything yet; tell the client to reveal
//     Confirm Password and resubmit.
// 3c. No account yet, confirmPassword WAS submitted -> this is the real
//     create-account attempt: validate the match server-side (never trust
//     the client-side check alone), apply the signup-per-IP rate limit, then
//     create + sign in for real.
//
// Deliberate trade-off, not an oversight: unlike the old "always show
// Confirm Password" design, this DOES let a visitor learn whether an email
// has an account (wrong-password vs. reveal-the-field are now
// distinguishable). Accepted per explicit product decision — everything else
// that guards against a bigger leak (rate limiting, generic Supabase errors,
// server-side re-validation) is unchanged.
export async function continueWithPassword(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const hasConfirmField = formData.get("confirmPassword") !== null;
  const confirmPassword = String(formData.get("confirmPassword") || "");
  const redirectTo = safeRedirect(String(formData.get("redirectTo") || ""), "/account");
  // Only sent when NEXT_PUBLIC_TURNSTILE_SITE_KEY is configured client-side
  // (components/common/TurnstileWidget.tsx renders nothing otherwise) — an
  // empty string here is simply ignored by Supabase unless CAPTCHA
  // protection has also been turned on in the Supabase dashboard.
  const turnstileToken = String(formData.get("turnstileToken") || "");

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
      checkedEmail: email,
    };
  }

  const supabase = await createCustomerClient();
  // The CAPTCHA token (when present) is passed to this first,
  // externally-triggered sign-in attempt. Turnstile tokens are single-use, so
  // the post-account-creation sign-in further below can't reuse it — it uses a
  // service-role magic-link instead (see there).
  const signInResult = await supabase.auth.signInWithPassword({
    email,
    password,
    options: turnstileToken ? { captchaToken: turnstileToken } : undefined,
  });

  if (signInResult.data.user) {
    await clearLoginAttempts(email);
    await upsertCustomer(signInResult.data.user);
    redirect(redirectTo);
  }

  const existingCustomer = await prisma.customer.findUnique({ where: { email } });
  if (existingCustomer) {
    await recordFailedLogin(email);
    return { error: "Incorrect password.", checkedEmail: email };
  }

  if (!hasConfirmField) {
    // First time we've seen this email fail to sign in with no matching
    // Customer row — don't create an account from a single field yet, ask
    // the client to confirm the password first.
    return { needsAccountCreation: true, checkedEmail: email };
  }

  // Re-validated here independently of the client-side check in LoginForm —
  // never trust client-side validation alone.
  if (password !== confirmPassword) {
    return {
      error: "Passwords do not match.",
      needsAccountCreation: true,
      checkedEmail: email,
    };
  }

  // Genuinely creating a new account now — cap how many accounts can be
  // created from one IP within a time window, to block scripted mass account
  // creation. Reuses the login lockout's table/gate, but inverted: we WANT
  // the counter to keep climbing across successes (each created account
  // should count against the cap), so unlike a real login we deliberately
  // never clear it — only the 15-minute window (lib/auth/rateLimit.ts)
  // resets it. Keyed under "signup:" so it can never collide with a real
  // login email or the coupon rate limit's key.
  const signupKey = `signup:${await getClientIp()}`;
  const signupGate = await checkLoginAllowed(signupKey);
  if (!signupGate.allowed) {
    const minutes = Math.ceil(signupGate.retryAfterSeconds / 60);
    return {
      error: `Too many accounts created from this network. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      needsAccountCreation: true,
      checkedEmail: email,
    };
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
    return {
      error: "Couldn't create your account. Please try again.",
      needsAccountCreation: true,
      checkedEmail: email,
    };
  }
  await recordFailedLogin(signupKey);

  // Establish the session WITHOUT a second CAPTCHA token. The Turnstile token
  // from this submit was already consumed by the first signInWithPassword
  // attempt above (Supabase verifies the token before checking credentials,
  // and tokens are single-use), so a plain password sign-in here would be
  // rejected by CAPTCHA. Instead mint a one-time magic-link token with the
  // service-role admin client (admin API bypasses CAPTCHA) and verify it on
  // the customer client — verifyOtp is not CAPTCHA-gated — which writes the
  // customer session cookie exactly like a password sign-in would.
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const tokenHash = linkData?.properties?.hashed_token;
  if (linkError || !tokenHash) {
    console.error("[login] post-signup generateLink failed:", linkError);
    return { error: "Account created, but sign-in failed. Please try logging in again." };
  }
  const secondSignIn = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
  if (!secondSignIn.data.user) {
    console.error("[login] post-signup verifyOtp failed:", secondSignIn.error);
    return { error: "Account created, but sign-in failed. Please try logging in again." };
  }

  await upsertCustomer(secondSignIn.data.user);
  redirect(redirectTo);
}
