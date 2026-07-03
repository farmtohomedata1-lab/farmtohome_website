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

  // Checked before ever touching Supabase Auth, so a locked-out account
  // can't be used to keep guessing passwords.
  const gate = await checkLoginAllowed(email);
  if (!gate.allowed) {
    const minutes = Math.ceil(gate.retryAfterSeconds / 60);
    return {
      error: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    await recordFailedLogin(email);
    return { error: "Invalid email or password." };
  }

  await clearLoginAttempts(email);
  redirect("/admin/cms");
}
