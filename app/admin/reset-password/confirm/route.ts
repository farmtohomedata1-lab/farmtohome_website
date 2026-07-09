import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const EMAIL_OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

// Admin counterpart to app/reset-password/confirm/route.ts. Exists for the
// same reason: Next.js only allows cookies().set() from a Server Action or
// Route Handler, so the recovery-session exchange must happen here (setting
// the ADMIN cookie via lib/supabase/server.ts) rather than in a Server
// Component render, or the session cookie silently fails to persist. Uses the
// admin Supabase client so the recovery session lands under the admin cookie,
// never the customer one.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const typeParam = searchParams.get("type");

  const supabase = await createClient();

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && typeParam && EMAIL_OTP_TYPES.includes(typeParam as EmailOtpType)
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: typeParam as EmailOtpType })
      : { error: new Error("missing code/token_hash") };

  if (error) {
    console.error("[admin/reset-password/confirm] verification failed:", error);
    return NextResponse.redirect(`${origin}/admin/reset-password?error=invalid_link`);
  }

  return NextResponse.redirect(`${origin}/admin/reset-password`);
}
