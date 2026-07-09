import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SECURE_COOKIE_OPTIONS } from "@/lib/supabase/cookieOptions";
import { isAdminEmail } from "@/lib/auth/adminAllowlist";

const LAST_ACTIVE_COOKIE = "admin_last_active";
const INACTIVITY_LIMIT_MS = 24 * 60 * 60 * 1000; // 24 hours

// Same distinct cookie name as lib/supabase/customerServer.ts /
// customerClient.ts — keeps the customer session fully independent from the
// admin session below, so logging in as one never clobbers the other in the
// same browser.
const CUSTOMER_COOKIE_NAME = "sb-customer-auth";

async function handleAdminRoute(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: SECURE_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() re-verifies the token against the Supabase Auth server rather
  // than trusting the cookie's contents — required for a real auth check.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // A valid session is not enough to be an admin: customer accounts live in
  // this same Supabase project, so gate on the admin allowlist too. Treating a
  // signed-in-but-not-allowlisted user as "not an admin" here (rather than as
  // `user`) is also what prevents a redirect loop — otherwise such a user
  // would be bounced from /admin/login to /admin/cms by this middleware and
  // straight back to /admin/login by the protected layout's own re-check.
  const isAdmin = !!user && isAdminEmail(user.email);

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === "/admin/login";
  // Admin auth pages a signed-OUT admin must be able to reach without being
  // bounced to /admin/login: the login page itself, plus the forgot/reset
  // password flow (/admin/forgot-password and /admin/reset-password[/confirm]).
  const isPublicAdminPath =
    isLoginPage ||
    pathname === "/admin/forgot-password" ||
    pathname.startsWith("/admin/reset-password");

  if (isAdmin) {
    const lastActiveRaw = request.cookies.get(LAST_ACTIVE_COOKIE)?.value;
    const lastActive = lastActiveRaw ? Number(lastActiveRaw) : null;
    const inactiveTooLong =
      lastActive !== null && Date.now() - lastActive > INACTIVITY_LIMIT_MS;

    if (inactiveTooLong) {
      await supabase.auth.signOut();
      const redirectUrl = new URL("/admin/login", request.url);
      redirectUrl.searchParams.set("expired", "1");
      const signedOutResponse = NextResponse.redirect(redirectUrl);
      signedOutResponse.cookies.delete(LAST_ACTIVE_COOKIE);
      return signedOutResponse;
    }

    response.cookies.set(LAST_ACTIVE_COOKIE, String(Date.now()), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    // Only bounce an already-signed-in admin away from the login page — never
    // away from /admin/reset-password, or they could never finish a password
    // reset (the confirm step establishes a recovery session first, which
    // makes them "signed in" while they're still on the reset page).
    if (isLoginPage) {
      return NextResponse.redirect(new URL("/admin/cms", request.url));
    }

    return response;
  }

  if (!isPublicAdminPath) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return response;
}

async function handleCustomerRoute(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { ...SECURE_COOKIE_OPTIONS, name: CUSTOMER_COOKIE_NAME },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) return response;

  // Not logged in — bounce to the login screen, carrying the exact path back
  // so a successful login lands straight back here (e.g. /checkout), never
  // through the cart or homepage first.
  const redirectUrl = new URL("/login", request.url);
  redirectUrl.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(redirectUrl);
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return handleAdminRoute(request);
  }
  return handleCustomerRoute(request);
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/checkout"],
};
