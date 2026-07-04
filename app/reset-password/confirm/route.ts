import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createCustomerClient } from "@/lib/supabase/customerServer";

const EMAIL_OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

// Dedicated Route Handler for the password-reset email link. This exists
// because Next.js only allows `cookies().set()` from a Server Action or a
// Route Handler — NOT from a plain Server Component render. The previous
// design did the exchangeCodeForSession/verifyOtp call directly inside
// app/reset-password/page.tsx's render, which meant the resulting session
// verified successfully for that one render (so the form appeared to work)
// but the cookie silently failed to persist — confirmed empirically (zero
// cookies in the browser afterward) — so the next request had no session at
// all. Doing the exchange here instead means the cookie is actually saved
// before the browser ever reaches the set-new-password page.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const typeParam = searchParams.get("type");

  const supabase = await createCustomerClient();

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && typeParam && EMAIL_OTP_TYPES.includes(typeParam as EmailOtpType)
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: typeParam as EmailOtpType })
      : { error: new Error("missing code/token_hash") };

  if (error) {
    console.error("[reset-password/confirm] verification failed:", error);
    return NextResponse.redirect(`${origin}/reset-password?error=invalid_link`);
  }

  return NextResponse.redirect(`${origin}/reset-password`);
}
