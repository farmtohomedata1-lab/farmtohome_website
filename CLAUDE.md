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
- Customers: Supabase Auth with magic link (passwordless email login) — no passwords
  to hash, store, or leak
- Guest checkout still allowed — accounts are optional, for customers who want saved
  addresses and order history, not required to place an order
- RLS: a logged-in customer can only read their own orders/addresses, never another
  customer's data

## Rules
- Keep it simple. Client has zero technical staff — no feature should need them to
  understand code, servers, or configs.
- COD only for now. No payment gateway. Architecture should allow adding
  PayNow/Stripe later without a rewrite.
- Keep files focused and split by responsibility — smaller, single-purpose files are
  easier to debug and maintain, don't force everything into one large file
- Client will specify adn tell exact pages/features needed
- Design will given by client