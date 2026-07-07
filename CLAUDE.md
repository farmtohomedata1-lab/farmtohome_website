# Project: Grocery Delivery Site (Singapore)

## Stack
Next.js (App Router) + TypeScript + Tailwind
Supabase (Postgres + Auth + Storage)
Prisma ORM
Resend for order email alerts
Deployed on Vercel free tier

## Standards
- Secure, fast, zero console warnings/errors across the whole site
- Enable Supabase Row Level Security on every table
- Never expose the Supabase service role key client-side
- Mobile-first — most customers order from phones, responsiveness is non-negotiable

## Auth
- Admin: Supabase Auth, protected /admin routes, server-side session check
  (`requireAuthedUser()`), re-checked at both the `proxy.ts` middleware layer
  and every protected page/action — never relies on middleware alone.
- Customers: Supabase Auth, **fully password-based** — a single combined
  login/signup form (`app/login/LoginForm.tsx` + `actions.ts`). One
  email+password submit does double duty: creates the account the first time,
  signs in every time after. There is no separate signup page and no
  passwordless/magic-link flow — that was an earlier design note that never
  matched what got built, and password-based is the intended, permanent model
  now (this app expects real day-to-day signup volume, not a low-traffic
  internal tool). Security properties this relies on, all already in place:
  - Password hashing/storage is entirely Supabase's — this app never sees or
    stores a raw or hashed password itself.
  - Every session check re-verifies the token against the Supabase Auth
    server (`getUser()`), never trusts a decoded session/cookie alone — a
    stale or forged cookie can't pass as authenticated.
  - Failed-login lockout: 5 attempts / 15-minute lockout, keyed per email,
    DB-backed so it survives serverless cold starts (`lib/auth/rateLimit.ts`).
  - Signup-rate-limit: max 5 accounts created per IP / 15 minutes (same
    mechanism, different key prefix) — blocks scripted mass account creation.
  - Coupon brute-forcing is rate-limited the same way, since that endpoint is
    also unauthenticated (guest cart/checkout preview).
  - Confirm Password is conditional, not universal (deliberate product
    decision, made knowingly trading away some enumeration resistance for a
    better returning-customer experience): the form starts as a single
    email+password field. On submit, the server tries to sign in; if that
    fails because the account genuinely doesn't exist yet, it tells the
    client (without creating anything) to reveal a Confirm Password field and
    reframe as "create your account," and the *next* submit is the real
    creation attempt, still re-validated server-side. If the account exists
    and the password is simply wrong, the client only ever sees "Incorrect
    password" — no Confirm field, no account-creation framing.
  - **Trade-off, not an oversight:** this means "wrong password" vs. "no
    account for this email" are now distinguishable from the outside (unlike
    the previous design, which showed Confirm Password unconditionally on
    every submit specifically to keep those two cases indistinguishable).
    Everything else that guards against a bigger leak is unchanged: Supabase's
    own sign-in error is still generic (the app still disambiguates itself
    against the `Customer` table rather than asking Supabase a second
    question), rate limiting still applies to both login and account-creation
    attempts, and server-side re-validation of the password match is
    unchanged.
  - Minimum password length is 8 characters, no forced special-character/
    complexity rules — current guidance (NIST 800-63B) treats length as the
    meaningful lever and arbitrary composition rules as counterproductive.
- RLS is enabled on every table (defense-in-depth, confirmed live) — but it is
  **not** the actual access-control mechanism here: Prisma connects via the
  Postgres table-owner role, which bypasses RLS regardless of policy. The
  real enforcement is explicit application-code checks — every Server Action
  that reads/writes an order or address re-fetches the target row and
  compares `customerId` against the authenticated customer before proceeding
  (see e.g. `app/account/actions.ts`, `app/order-confirmation/[orderId]/page.tsx`).

## Rules
- Keep it simple. Client has zero technical staff — no feature should need them to
  understand code, servers, or configs.
- COD and manual PayNow (admin-uploaded QR code, customer self-declares
  payment, admin confirms) are the two payment methods today — no live
  payment gateway yet. Architecture should allow adding a real gateway
  (Stripe, PayNow API) later without a rewrite.
- **Checkout currently requires a customer account** — `/checkout` (and
  `/account`) redirect an unauthenticated visitor to `/login` (`proxy.ts`).
  There is no guest checkout today, despite an earlier version of this file
  saying otherwise. Flagged explicitly because it's a real product decision,
  not just a wording fix — confirm this is actually the intended policy
  before treating it as settled.
- Keep files focused and split by responsibility — smaller, single-purpose files are
  easier to debug and maintain, don't force everything into one large file
- Client will specify and tell exact pages/features needed
- Design will given by client