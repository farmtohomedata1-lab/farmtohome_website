import "server-only";
import { headers } from "next/headers";

// Best-effort client IP for rate-limiting anonymous requests (coupon
// attempts, signup). "x-forwarded-for" can carry a comma-separated chain of
// proxy hops — the client's own address is always the first one. Falls back
// to "unknown" (e.g. local dev without a proxy in front of it) rather than
// throwing, since a missing IP should degrade rate-limiting, not break the
// request.
export async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headersList.get("x-real-ip") ?? "unknown";
}
