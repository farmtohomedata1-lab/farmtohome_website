// Canonical site origin — used for metadataBase (root layout) and anywhere
// a fully-qualified URL is required (e.g. schema.org structured data's
// image field, which per spec must be absolute, not relative). Falls back
// to the known Vercel deployment URL so this works with zero setup; set
// NEXT_PUBLIC_SITE_URL once a custom domain is live so both stay correct.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://farmtohome-website.vercel.app";

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}
