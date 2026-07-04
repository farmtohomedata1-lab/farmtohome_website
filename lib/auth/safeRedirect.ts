// Shared by the login/forgot-password/reset-password pages and actions — the
// single source of truth for validating a `redirect`/`next` target is a
// same-site relative path. Accepting an absolute URL here would be an open
// redirect (e.g. ?redirect=https://evil.example).
export function safeRedirect(path: string | null | undefined, fallback: string): string {
  if (path && path.startsWith("/") && !path.startsWith("//")) return path;
  return fallback;
}
