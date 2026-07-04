import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  if (user) {
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

    if (isLoginPage) {
      return NextResponse.redirect(new URL("/admin/cms", request.url));
    }

    return response;
  }

  if (!isLoginPage) {
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
      cookieOptions: { name: CUSTOMER_COOKIE_NAME },
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
