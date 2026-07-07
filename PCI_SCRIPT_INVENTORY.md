# Payment Page Script Inventory

Required by PCI DSS v4.0.1 requirements 6.4.3 (inventory every script on a
payment page, with a business justification for each) and 11.6.1 (detect and
alert on unauthorized changes to those scripts). This covers every page that
can render Stripe's card-entry form:

- `/checkout` — a brand-new order
- `/order-confirmation/[orderId]` — retrying a failed Stripe payment

Both pages share the same root layout (`app/layout.tsx`) and the same
`StripeCheckoutStep` / `StripePaymentForm` components, so this inventory
applies to both.

## What actually runs on these pages

| Script / origin | Loaded by | Purpose | Business justification |
|---|---|---|---|
| Next.js's own application bundle, self-hosted from `/_next/static/...` | The framework itself | Renders the entire page | Required for the site to function at all. Not third-party — it's this app's own code, reviewed the same way as everything else in this repo. |
| `js.stripe.com` (Stripe.js) | `@stripe/stripe-js`'s `loadStripe()` (`lib/stripe/client.ts`), dynamically injected — never a static `<script>` tag in our HTML | Renders the Payment Element: the actual card number/expiry/CVC fields, inside Stripe's own iframe | Required to accept card payments. This is also what keeps cardholder data out of this app's own code and DOM entirely — the card fields live in an iframe on Stripe's origin, not ours. |
| `hooks.stripe.com` (3D Secure / SCA challenge iframe) | Triggered by Stripe.js automatically when a card issuer requires Strong Customer Authentication | Shows the bank's own authentication challenge | Required for SCA-mandated cards (see the 3DS verification section of this project's security hardening log). Never reachable/loadable except as a direct consequence of Stripe.js's own logic — nothing in this app's code references it directly. |

**Nothing else runs on either page.** Confirmed by tracing both pages' full
render trees (every component, both layout chains) and by a whole-codebase
sweep for `next/script`, literal `<script`, `dangerouslySetInnerHTML`, and
common analytics identifiers (Google Analytics/GTM, Meta Pixel, Hotjar,
Segment, Mixpanel, etc.) — zero matches anywhere in the repository. There is
no analytics package in `package.json` at all. The only other non-framework
script anywhere in the codebase (Cloudflare Turnstile,
`components/common/TurnstileWidget.tsx`) only ever renders on `/login`, which
neither payment page redirects through or embeds.

The site's Content-Security-Policy (`next.config.ts`) is the enforcement
mechanism for this table — its `script-src`/`frame-src`/`connect-src`
directives only allow the origins listed above (plus Cloudflare Turnstile and
Supabase, which this policy applies site-wide but which the trace above
confirms never load on these two pages specifically). Any script from any
other origin is blocked by the browser before it can run, on every page, not
just these two.

## Why Stripe.js has no Subresource Integrity (SRI) hash here

This is a deliberate omission, not an oversight. Stripe's own guidance is
that Stripe.js must be loaded live from `js.stripe.com` — never self-hosted,
never pinned to a fixed SRI hash — because:

1. The script is updated frequently (sometimes multiple times a week) to
   respond to new fraud patterns feeding Stripe Radar's risk scoring. A fixed
   SRI hash would break the moment Stripe pushes an update, and would have to
   be manually re-generated and redeployed here every time — turning a
   security control into a recurring source of checkout outages.
2. Pinning an old version via SRI (to keep a hash stable) would mean
   deliberately running stale fraud-detection logic, which is a worse
   security trade-off than not having SRI at all.

This is the same reasoning Stripe documents publicly and the same conclusion
most PCI-scoped merchants using Stripe.js reach. The CSP's `script-src`
allowlist (restricting *which origin* can serve this script to `js.stripe.com`
specifically) is this project's actual control here — SRI would add
integrity-of-content verification on top of that, at the cost above, for a
script this app already can't meaningfully audit the contents of regardless
(it's Stripe's proprietary fraud-detection logic).

## Tamper detection (PCI DSS 11.6.1)

The CSP above is paired with violation reporting
(`report-uri`/`report-to` directives → `Reporting-Endpoints` header →
`app/api/csp-report/route.ts`), so any attempt to load an unauthorized
script or send data to an unauthorized origin on these pages — the exact
signature of a client-side skimming attack — is both **blocked** by the CSP
and **reported** in real time (logged, and forwarded to Sentry once
`NEXT_PUBLIC_SENTRY_DSN` is configured — see `.env.example`). This is this
project's practical, low-overhead equivalent of a commercial script-tamper-
monitoring product, appropriate for a small single-owner site.

## Keeping this current

Review this document whenever a script, iframe, or third-party embed is
added anywhere that could end up rendered on `/checkout` or
`/order-confirmation/[orderId]` — including anything added to the shared
root layout, header, or footer, since those wrap every page including these
two. If in doubt, re-run the same whole-codebase sweep described above.

Last reviewed: 2026-07-06.
