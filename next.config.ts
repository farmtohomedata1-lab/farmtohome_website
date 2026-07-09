import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Every external domain this app actually talks to from the browser, in one
// place, so the CSP below and any future audit can be checked against a
// single list instead of re-deriving it from scattered fetch/img/iframe
// call sites:
// - js.stripe.com / hooks.stripe.com / api.stripe.com — Stripe Elements
//   (Payment Element iframe, 3D Secure challenge iframe, confirmPayment API)
// - challenges.cloudflare.com — Turnstile CAPTCHA widget on login/signup
// - *.supabase.co — Storage-hosted CMS/product images, Auth/DB over HTTPS
// - images.unsplash.com — placeholder product photography (content/*.ts)
// - www.google.com — the homepage's embedded Google Map (no API key, plain
//   iframe embed)
// next.config's headers() runs at config-eval time (dev server boot / next
// build), so this reflects the real mode each time — never a per-request
// check. Next.js itself forces NODE_ENV to "development" under `next dev`
// and "production" under `next build`, so this can't be spoofed by an env
// var left over from something else.
const isDev = process.env.NODE_ENV === "development";

const cspDirectives = [
  `default-src 'self'`,
  // 'unsafe-inline' is required here because this is a static CSP (declared
  // in next.config, not middleware) — Next.js's own hydration/RSC payload
  // ships as inline <script> tags with per-request content, which can't be
  // allow-listed by a fixed hash and there's no per-request nonce without
  // moving this into middleware. Everything else below is scoped as tightly
  // as the app actually needs, so this isn't "no CSP", it's "CSP that can't
  // stop inline-script XSS specifically" — a real gap, but a known, deliberate
  // one, not an oversight.
  // 'unsafe-eval' is dev-only: React's dev-mode stack-trace reconstruction
  // needs it (see the console warning it prints otherwise), and it's never
  // used in production React regardless of what the CSP allows — but the
  // production CSP must never carry it, so it's added conditionally rather
  // than unconditionally like the rest of this directive.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://js.stripe.com https://challenges.cloudflare.com`,
  // Same inline-attribute reality for style-src: framer-motion (used
  // throughout components/home, components/about, etc.) animates via inline
  // `style` attributes, which style-src also governs.
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co`,
  `font-src 'self' data:`,
  `connect-src 'self' https://*.supabase.co https://api.stripe.com https://challenges.cloudflare.com`,
  `frame-src https://js.stripe.com https://hooks.stripe.com https://www.google.com https://challenges.cloudflare.com`,
  // Blocks this site from ever being iframed elsewhere (clickjacking on the
  // checkout flow being the specific worst case) — belt-and-suspenders with
  // the legacy X-Frame-Options header below.
  `frame-ancestors 'none'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `upgrade-insecure-requests`,
  // Tamper-detection half of PCI DSS v4.0.1 req 11.6.1 for the payment
  // pages (/checkout, /order-confirmation) — see PCI_SCRIPT_INVENTORY.md.
  // Both the legacy (report-uri) and current (report-to, paired with the
  // Reporting-Endpoints header below) reporting mechanisms point at the same
  // endpoint so this works across browsers regardless of which API they've
  // implemented.
  `report-uri /api/csp-report`,
  `report-to csp-endpoint`,
].join("; ");

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions default to a 1MB request body limit, independent of any
    // app-level file-size check (see MAX_UPLOAD_BYTES in
    // app/admin/(protected)/cms/actions.ts, set to 5MB). Without raising this,
    // every image upload above 1MB — i.e. almost any real phone photo —
    // never reaches that check at all: Next's own body parser throws first,
    // and the client sees it as a bare "Failed to fetch" rather than the
    // app's error message.
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  images: {
    // Every <Image> on the site was previously rendered with `unoptimized`
    // (bypassing Next.js's resizing/format-conversion/responsive-srcset
    // pipeline entirely) purely because no remote host was allowlisted here
    // — Unsplash for placeholder content, Supabase Storage for real
    // admin-uploaded photos.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: cspDirectives },
          // Pairs with the `report-to csp-endpoint` CSP directive above —
          // the modern Reporting API needs this header to know what URL
          // "csp-endpoint" actually refers to.
          {
            key: "Reporting-Endpoints",
            value: `csp-endpoint="/api/csp-report"`,
          },
          // 2 years, includeSubDomains, preload-eligible — only takes effect
          // once the browser has actually seen it over a real HTTPS
          // connection, so this is inert (not wrong) during local http dev.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Denies browser features this site has no legitimate use for —
          // reduces what an injected/compromised script could ever do even
          // if one slipped past every other layer.
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), usb=(), magnetometer=(), gyroscope=(), payment=(self \"https://js.stripe.com\")",
          },
        ],
      },
    ];
  },
};

// Error tracking only — this project deliberately doesn't upload source maps
// (no SENTRY_AUTH_TOKEN/org/project wired up, and sourcemaps are explicitly
// disabled below regardless) or enable performance tracing/session replay,
// so it stays well within Sentry's free tier without any sampling-rate
// tuning. Wrapping is still required even in this minimal mode — it's what
// wires up server/edge error capture via instrumentation.ts.
export default withSentryConfig(nextConfig, {
  silent: true,
  telemetry: false,
  sourcemaps: { disable: true },
});
