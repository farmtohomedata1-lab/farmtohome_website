"use server";

import { redirect } from "next/navigation";
import { createCustomerClient } from "@/lib/supabase/customerServer";

export interface ResetPasswordState {
  error?: string;
}

const MIN_PASSWORD_LENGTH = 8;

export async function updatePassword(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const password = String(formData.get("password") || "");

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }

  const supabase = await createCustomerClient();

  // The recovery session was already established by app/reset-password/page.tsx
  // (via exchangeCodeForSession/verifyOtp) before this form was ever shown —
  // re-check it's still valid rather than trusting the page render alone.
  const { data, error: sessionError } = await supabase.auth.getUser();
  if (sessionError || !data.user) {
    return { error: "Your reset link has expired. Please request a new one." };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) {
    console.error("[reset-password] updateUser failed:", updateError);
    return { error: "Couldn't update your password. Please try again." };
  }

  // Sign out of the temporary recovery session so the customer logs back in
  // fresh with the new password, per the required "redirect to login" flow.
  await supabase.auth.signOut();
  redirect("/login?reset=1");
}
