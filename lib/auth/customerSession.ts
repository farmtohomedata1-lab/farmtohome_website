import "server-only";
import { redirect } from "next/navigation";
import { createCustomerClient } from "@/lib/supabase/customerServer";
import { prisma } from "@/lib/prisma";

// Verifies against the Supabase Auth server (getUser, not getSession) so a
// stale/forged cookie can't pass as authenticated — same principle as the
// admin equivalent in lib/auth/session.ts, but scoped to the customer
// cookie/session and the Customer table instead of the admin identity.
export async function getAuthedCustomer() {
  const supabase = await createCustomerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  // Looked up, never created here — Customer rows are only ever created by
  // the upsert in app/login/actions.ts at first-login (== signup) time.
  return prisma.customer.findUnique({ where: { supabaseUserId: data.user.id } });
}

// Call at the top of every customer-only page/action. redirectTo is the path
// to return to immediately after login (e.g. "/checkout") — carried through
// app/login's form so a customer lands exactly back where they were, never
// bounced through the cart or homepage first.
export async function requireAuthedCustomer(redirectTo: string) {
  const customer = await getAuthedCustomer();
  if (!customer) {
    redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  }
  return customer;
}
