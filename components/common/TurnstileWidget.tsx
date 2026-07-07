"use client";

import { useEffect, useId } from "react";
import Script from "next/script";

// Cloudflare Turnstile, implicit-render mode: load their script once, drop a
// `cf-turnstile` div with a `data-sitekey`, and Cloudflare's script finds and
// renders it automatically. No @marsidev/react-turnstile or similar package
// needed for something this small.
//
// Renders nothing at all if no site key is configured yet (NEXT_PUBLIC_
// prefixed, so this check runs client-side) — same graceful-degradation
// pattern as Stripe elsewhere in this app: until Cloudflare + Supabase are
// both wired up, auth forms work exactly as they did before this existed.
export default function TurnstileWidget({ onVerify }: { onVerify: (token: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const callbackName = `turnstileCallback_${reactId}`;

  useEffect(() => {
    if (!siteKey) return;
    (window as unknown as Record<string, (token: string) => void>)[callbackName] = onVerify;
    return () => {
      delete (window as unknown as Record<string, unknown>)[callbackName];
    };
  }, [siteKey, callbackName, onVerify]);

  if (!siteKey) return null;

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div className="cf-turnstile" data-sitekey={siteKey} data-callback={callbackName} />
    </>
  );
}
