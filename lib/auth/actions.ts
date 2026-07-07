"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCustomerClient } from "@/lib/supabase/customerServer";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// Customer counterpart to signOut() above. Must be a Server Action, not a
// client-side supabase.auth.signOut() call — the session cookie is httpOnly
// (see lib/supabase/cookieOptions.ts), which client-side JS can neither read
// nor clear. A browser-side signOut() on an httpOnly-cookied session can't
// even identify the current session to revoke it, so it was a no-op against
// the real cookie: the UI looked signed-out (local React state only) but a
// refresh showed the customer still logged in. Using the SERVER customer
// client here (lib/supabase/customerServer.ts) reads the real cookie,
// revokes the session with Supabase, and its cookie adapter writes the
// expired Set-Cookie back on the response — the same mechanism signOut()
// above already relied on for admin.
export async function signOutCustomer() {
  const supabase = await createCustomerClient();
  await supabase.auth.signOut();
  redirect("/");
}
