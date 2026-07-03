import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Always re-verifies against the Supabase Auth server (getUser, not
// getSession) so a stale/forged cookie can't pass as authenticated.
export async function getAuthedUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

// Call at the top of every admin Server Action / Route Handler that writes
// data — middleware protects page navigation, but a direct action/API call
// must independently re-check the session server-side, per CLAUDE.md's
// "strict auth" requirement.
export async function requireAuthedUser() {
  const user = await getAuthedUser();
  if (!user) redirect("/admin/login");
  return user;
}
