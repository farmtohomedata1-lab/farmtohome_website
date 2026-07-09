import type { User } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────────────
// SECURITY-CRITICAL. READ THIS BEFORE CHANGING ANYTHING IN THIS FILE.
//
// This file is the ONLY thing standing between a customer and the admin
// panel. It exists because of a real, shipped vulnerability:
//
//   Admin and customer accounts live in the SAME Supabase Auth project.
//   Customers are created with admin.createUser() in app/login/actions.ts,
//   and the admin signs in with signInWithPassword() against that same
//   project. For a long time /admin/login and requireAuthedUser() only asked
//   Supabase "is this a valid user?" — which is TRUE for every customer.
//   Result: any real customer could type their own email + password into
//   /admin/login and get FULL admin access — every order, every customer's
//   personal data, and the ability to mark payments as paid.
//
// Authentication (Supabase) proves WHO you are. This file is the missing
// AUTHORIZATION layer that proves you're allowed to be an admin. Do NOT
// "simplify" this away, inline it back into a bare getUser() check, or trust
// a session/cookie without running it through here. If you remove the
// allowlist check, you reopen the single worst hole this project ever had.
// (There is an automated test — lib/auth/adminAllowlist.test.ts, run on every
//  build — specifically so this can't silently regress.)
// ─────────────────────────────────────────────────────────────────────────

// Which email addresses are allowed to hold an ADMIN session. Configured via
// the ADMIN_EMAILS env var (comma-separated, server-only — never
// NEXT_PUBLIC_). FAIL-CLOSED: if it's empty/unset, nobody is treated as an
// admin. Locking the real admin out until the var is set is the safe failure
// mode; silently letting everyone in is not.
//
// Deliberately NOT importing "server-only": this is imported by proxy.ts
// (middleware) as well as server components/actions, AND by the regression
// test. It only ever reads a non-public env var that is undefined in the
// browser regardless, so it exposes nothing client-side.
//
// Parsed on every call rather than cached at module load, mirroring
// lib/stripe/server.ts's per-call env read: a serverless instance that
// started before ADMIN_EMAILS was set must not cache an empty allowlist
// forever. The work is a trivial string split.
function parseAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return parseAdminEmails().has(email.trim().toLowerCase());
}

// The exact admin authorization decision, extracted as a pure function so it
// can be unit-tested without Supabase or Next internals (lib/auth/session.ts
// imports "server-only" and can't be imported by a test). getAuthedUser() is
// a thin wrapper that just feeds it the live getUser() result — so this IS
// the gate, not a copy of it.
//
// Takes the shape returned by supabase.auth.getUser(): a valid session is
// necessary but NOT sufficient — the authenticated email must also be on the
// allowlist above. Returns the User only when BOTH hold, otherwise null.
export function resolveAdminUser(result: {
  data: { user: User | null };
  error: unknown;
}): User | null {
  if (result.error || !result.data.user) return null;
  // ⛔ Do not delete this line. See the SECURITY-CRITICAL banner at the top of
  // this file — dropping the allowlist check here reopens the customer →
  // admin privilege-escalation hole.
  if (!isAdminEmail(result.data.user.email)) return null;
  return result.data.user;
}
