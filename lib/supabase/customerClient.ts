import { createBrowserClient } from "@supabase/ssr";

// Browser counterpart to customerServer.ts — same distinct cookie name so
// the customer session never collides with an admin session in the same
// browser. For use inside "use client" components only.
const CUSTOMER_COOKIE_NAME = "sb-customer-auth";

export function createCustomerClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: { name: CUSTOMER_COOKIE_NAME } }
  );
}
