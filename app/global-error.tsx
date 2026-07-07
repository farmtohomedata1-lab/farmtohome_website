"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import "./globals.css";

// Next.js's special root-level error boundary — only fires when something
// throws above/outside every other error.tsx in the tree (rare), so it must
// define its own complete <html>/<body>, the normal root layout is bypassed
// entirely. Reports to Sentry (if configured) before rendering, then shows a
// plain, on-brand apology rather than the default Next.js error screen.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-lg font-bold text-dark-green">Something went wrong</p>
          <p className="max-w-sm text-sm text-gray-500">
            We&apos;ve been notified and are looking into it. Please try refreshing the page.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 rounded-md bg-brand-green px-5 py-2.5 text-sm font-semibold text-white"
          >
            Refresh
          </button>
        </div>
      </body>
    </html>
  );
}
