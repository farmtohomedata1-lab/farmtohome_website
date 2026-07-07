# Data Breach Incident Response

A short, practical readiness guide — not a technical build, and not legal
advice. If a real breach happens, get a lawyer/data protection professional
involved early; the PDPA section below is a starting point, not a
compliance sign-off.

## What this app stores about customers

From `prisma/schema.prisma`'s `Customer`, `Address`, and `Order` models:

- Name, email, phone number
- Delivery address(es)
- Order history (items, totals, delivery dates, order notes)
- Supabase Auth account (email + Supabase's own hashed password — this app
  never sees or stores a raw or hashed password itself, see `CLAUDE.md`)

**What it does NOT store: any payment card data, ever.** Card numbers,
expiry, and CVC are entered directly into Stripe's own hosted iframe
(`components/checkout/StripePaymentForm.tsx`'s `<PaymentElement />`) and go
straight to Stripe — they never reach this app's server, database, or logs.
A breach of this app's own database or code, however severe, cannot expose
card data because this app never holds any to begin with.

## Who to contact

- **Site owner / data controller:** [fill in — the person legally
  responsible for this business's PDPA compliance]
- **Technical contact:** [fill in — whoever can rotate keys and access
  Supabase/Vercel/Stripe dashboards on short notice]
- **PDPC (if notification is required):** https://www.pdpc.gov.sg/report-data-breach

## First steps if a breach is suspected

1. **Contain it first.** If a key/credential is the suspected cause, rotate
   it immediately (see below) before investigating further — stopping
   ongoing access matters more than preserving evidence of exactly how it
   happened.
2. **Rotate credentials:**
   - Supabase: `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     and the database password (Supabase Dashboard → Project Settings →
     API / Database)
   - Stripe: the restricted API key and webhook signing secret (Dashboard →
     Developers)
   - Resend: `RESEND_API_KEY`
3. **Check the admin Activity Log** (`/admin/activity-log`) for any
   unrecognized admin action — this is the first place unauthorized use of
   an admin account would show up (order changes, product edits, settings
   changes, all attributed to an admin email and timestamped).
4. **Check Sentry** (if configured) for any error spike or unusual pattern
   around the suspected timeframe.
5. **Assess scope:** which customers/orders could be affected? Query the
   `Customer`/`Order` tables directly (via `prisma studio` or the Supabase
   dashboard) rather than guessing — PDPA's notification thresholds (below)
   depend on how many individuals are actually affected.
6. **Determine notifiability** (see below) and act on the applicable
   deadline.
7. **Document what happened and when** — the assessment date is what
   starts the PDPC's 3-day notification clock, so note it explicitly.

## Singapore PDPA breach notification — practical summary

(Current understanding as of 2026; thresholds have been subject to
amendment, so verify against the PDPC's current guidance before relying on
this for an actual filing: https://www.pdpc.gov.sg/required-to-notify-the-pdpc)

A breach is notifiable to the PDPC if **either**:

- It's likely to cause **significant harm** to affected individuals
  (financial loss, identity theft, physical harm, reputational damage), or
- It affects **500 or more individuals**, regardless of harm

If notifiable: notify the **PDPC within 3 calendar days** of completing the
assessment that it's notifiable (not 3 days from discovery — from the
assessment), and notify **affected individuals** if the significant-harm
threshold applies. Failing to notify when required is itself a separate
PDPA violation, on top of whatever caused the breach.

Given this app never stores payment card data, the realistic breach
scenarios are limited to the data listed above (contact/address/order
info) — still personal data under the PDPA and still subject to these
rules, but a narrower blast radius than a typical e-commerce breach
involving card data.
