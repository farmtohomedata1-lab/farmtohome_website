import "server-only";
import * as Sentry from "@sentry/nextjs";

// Receives the browser's own CSP violation reports (both the legacy
// report-uri format and the modern Reporting API report-to format — see the
// report-uri/report-to/Reporting-Endpoints wiring in next.config.ts). This
// is this small site's practical stand-in for a commercial script-tamper-
// detection product (PCI DSS v4.0.1 req 11.6.1): if a skimming script ever
// tried to inject a new <script> tag or exfiltrate data to a new origin on
// /checkout or /order-confirmation, the CSP itself would block it AND the
// browser would report the attempt here, automatically and in real time.
// See PCI_SCRIPT_INVENTORY.md for the full reasoning.
const MAX_BODY_BYTES = 20_000;

export async function POST(request: Request): Promise<Response> {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > MAX_BODY_BYTES) {
      return new Response(null, { status: 413 });
    }

    const body = await request.text();
    if (body.length > MAX_BODY_BYTES) {
      return new Response(null, { status: 413 });
    }

    const parsed: unknown = JSON.parse(body);
    console.warn("[csp-report]", JSON.stringify(parsed));
    Sentry.captureMessage("CSP violation report", {
      level: "warning",
      extra: { report: parsed },
    });
  } catch (err) {
    // Malformed/empty report bodies happen (some browsers send odd payloads
    // for certain violation types) — never let that surface as a 500.
    console.error("[csp-report] failed to parse report body:", err);
  }

  // 204: browsers don't do anything with the response body for reports.
  return new Response(null, { status: 204 });
}
