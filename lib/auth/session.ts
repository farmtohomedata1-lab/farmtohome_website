import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveAdminUser } from "@/lib/auth/adminAllowlist";

// Always re-verifies against the Supabase Auth server (getUser, not
// getSession) so a stale/forged cookie can't pass as authenticated.
//
// A valid session is necessary but NOT sufficient for admin access: customer
// accounts live in the same Supabase Auth project, so the authenticated email
// must also be on the admin allowlist. That decision lives in
// resolveAdminUser (lib/auth/adminAllowlist.ts) — a pure, unit-tested
// function — and this is a thin wrapper that feeds it the live getUser()
// result. This is the single choke point every admin page (via the protected
// layout) and every admin Server Action (via requireAuthedUser) funnels
// through, so the allowlist is enforced everywhere server-side, not just at
// the login form. Do NOT bypass resolveAdminUser here — see the
// SECURITY-CRITICAL banner in adminAllowlist.ts.
export async function getAuthedUser() {
  const supabase = await createClient();
  return resolveAdminUser(await supabase.auth.getUser());
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
