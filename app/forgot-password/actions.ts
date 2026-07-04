"use server";

import { headers } from "next/headers";
import { createCustomerClient } from "@/lib/supabase/customerServer";

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

  const headersList = await headers();
  const origin = headersList.get("origin") ?? `https://${headersList.get("host")}`;

  const supabase = await createCustomerClient();
  // Supabase deliberately never errors here for an email with no account —
  // it always responds as if the email was sent, to avoid revealing which
  // emails have accounts. A real error here means something else broke.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password/confirm`,
  });

  if (error) {
    console.error("[forgot-password] resetPasswordForEmail failed:", error);
    return { status: "error", error: "Couldn't send the reset link. Please try again in a moment." };
  }

  return { status: "sent" };
}
