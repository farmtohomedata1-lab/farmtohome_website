"use client";

import { useEffect } from "react";

// Mounted once on the home page. Handles the "clicked a #hash link from a
// different page" case: the browser/Next.js have already navigated to "/"
// with the hash in the URL by the time this runs, so we just need to find
// the target and scroll to it — `scroll-smooth` on <html> (app/layout.tsx)
// makes it animate rather than jump.
export default function ScrollToHash() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return null;
}
