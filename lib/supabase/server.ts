import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SECURE_COOKIE_OPTIONS } from "./cookieOptions";

// Server client for use in Server Components, Server Actions, and Route
// Handlers. Create a fresh instance per request — never module-level cache.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: SECURE_COOKIE_OPTIONS,
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
