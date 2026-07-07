import type { MouseEvent } from "react";

// Shared by NavBar (desktop) and SiteHeaderClient (mobile) for nav links that
// point at an in-page anchor on the homepage (e.g. "/#gallery"). When we're
// already on "/", intercept the click and scroll manually instead of letting
// Link push a redundant same-page navigation — `scroll-smooth` on <html>
// (see app/layout.tsx) makes this animate smoothly. When we're on a
// different page, do nothing special: Link navigates to "/", and
// ScrollToHash (mounted on the home page) smooth-scrolls once it lands.
export function handleHashNavClick(e: MouseEvent<HTMLAnchorElement>, href: string, pathname: string) {
  if (!href.startsWith("/#") || pathname !== "/") return;
  e.preventDefault();
  document.getElementById(href.slice(2))?.scrollIntoView({ behavior: "smooth" });
}
