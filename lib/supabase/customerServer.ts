import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Customer-facing Supabase client — deliberately separate from
// lib/supabase/server.ts (admin). Supabase Auth stores its session under one
// cookie key per project by default; without a distinct `cookieOptions.name`
// here, a customer logging in in the same browser as a signed-in admin would
// silently overwrite that admin session (or vice versa). This name keeps the
// two sessions fully independent.
const CUSTOMER_COOKIE_NAME = "sb-customer-auth";

export async function createCustomerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: CUSTOMER_COOKIE_NAME },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render — safe to ignore since
            // middleware refreshes the session on every request.
          }
        },
      },
    }
  );
}
