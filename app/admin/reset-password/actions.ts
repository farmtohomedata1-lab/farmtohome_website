"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/adminAllowlist";
import { sendAdminPasswordResetCompletedEmail } from "@/lib/email/securityAlertEmail";

export interface AdminResetState {
  error?: string;
}

const MIN_PASSWORD_LENGTH = 8;

export async function updateAdminPassword(
  _prevState: AdminResetState,
  formData: FormData
): Promise<AdminResetState> {
  const password = String(formData.get("password") || "");

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }

  const supabase = await createClient();

  // The recovery session was established by app/admin/reset-password/confirm's
  // route handler before this form rendered — re-verify it here, and re-verify
  // the account is actually on the admin allowlist, so this endpoint can never
  // be used to set a password on a non-admin account even with a valid link.
  const { data, error: sessionError } = await supabase.auth.getUser();
  if (sessionError || !data.user || !isAdminEmail(data.user.email)) {
    return { error: "Your reset link has expired or isn't valid for an admin account. Please request a new one." };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) {
    console.error("[admin/reset-password] updateUser failed:", updateError);
    return { error: "Couldn't update your password. Please try again." };
  }

  // Second, distinct alert — the password has now ACTUALLY changed (vs. the
  // "requested" alert that fired earlier). data.user.email is guaranteed
  // present here by the isAdminEmail check above.
  await sendAdminPasswordResetCompletedEmail(data.user.email!);

  // Drop the temporary recovery session so the admin signs back in fresh with
  // the new password.
  await supabase.auth.signOut();
  redirect("/admin/login?reset=1");
}
