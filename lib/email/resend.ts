import "server-only";
import { Resend } from "resend";

let cachedClient: Resend | null | undefined;
let warnedMissing = false;

// Lazy + cached (the Resend instance itself is only constructed once), but
// the "is the key actually defined in THIS process" check runs on every
// call — a long-lived dev server started before RESEND_API_KEY was added to
// .env would otherwise cache `null` forever and never notice the var showed
// up later, which is exactly the kind of silent failure this project has
// already hit once. If the key is genuinely missing this still no-ops
// instead of crashing — placing an order must never fail because email
// hasn't been set up yet.
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  console.log(`[email] RESEND_API_KEY defined at runtime: ${Boolean(apiKey)}`);

  if (!apiKey) {
    if (!warnedMissing) {
      console.warn("[email] RESEND_API_KEY is not set — order emails will be skipped.");
      warnedMissing = true;
    }
    cachedClient = null;
    return null;
  }

  if (cachedClient === undefined || cachedClient === null) {
    cachedClient = new Resend(apiKey);
  }
  return cachedClient;
}
