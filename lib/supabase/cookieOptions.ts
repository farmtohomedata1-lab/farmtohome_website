// @supabase/ssr's own DEFAULT_COOKIE_OPTIONS (confirmed by reading the
// installed package source, node_modules/@supabase/ssr/.../utils/constants.js)
// is { path: "/", sameSite: "lax", httpOnly: FALSE }, with no `secure` at
// all. httpOnly:false means the session cookie is readable via
// `document.cookie` from any JS running on the page — if this site ever has
// an XSS bug (here or in a compromised dependency), that script could read
// and exfiltrate the session directly. Nothing in this app reads Supabase's
// session cookie from client-side JS (all auth checks are server-side via
// getUser()), so there is no functional reason for it to be script-readable.
//
// Passed as `cookieOptions` to every createServerClient(...) call in this
// project (lib/supabase/server.ts, lib/supabase/customerServer.ts, and
// proxy.ts's two inline clients) — @supabase/ssr spreads this on top of its
// own defaults, so this single object is what actually wins.
export const SECURE_COOKIE_OPTIONS = {
  httpOnly: true,
  // Must stay off for local http://localhost dev — a `secure` cookie is
  // silently dropped by the browser over plain HTTP, which would break
  // login entirely outside of a real HTTPS deployment. Same pattern already
  // used for the admin_last_active cookie in proxy.ts.
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};
