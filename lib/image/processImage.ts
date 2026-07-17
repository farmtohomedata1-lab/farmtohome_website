// Deliberately NOT importing "server-only" (unlike most of lib/): this
// function touches no secrets/credentials, only a dynamic import of "sharp"
// and buffer processing, and needs to be importable by a plain node:test
// script (no Next.js runtime) so its fallback guarantee is directly unit
// testable — see lib/auth/adminAllowlist.ts for the same reasoning applied
// to that file.

export interface ProcessImageResult {
  buffer: Uint8Array;
  contentType: string;
  extension: string;
}

// ─────────────────────────────────────────────────────────────────────────
// RESILIENCE-CRITICAL. Compression is a nice-to-have; it must NEVER be a
// hard dependency for an image upload to succeed.
//
// Real incident, confirmed via Vercel's own function logs: sharp's native
// binary (@img/sharp-<platform>-<arch>, resolved dynamically at runtime)
// failed to load on the live linux-x64 runtime — "Failed to load external
// module sharp-...: ERR_DLOPEN_FAILED: libvips-cpp.so... cannot open shared
// object file" — and because sharp was previously imported STATICALLY at
// the top of the calling module, that failure happened at module-evaluation
// time, before any function body's try/catch could ever run. It crashed
// every admin action sharing that module's serverless function bundle, not
// just image uploads.
//
// This function is the fix: sharp is imported DYNAMICALLY, inside the try
// block, at the point of actual use — a failed dynamic import() is just a
// rejected Promise, catchable exactly where it's awaited, unlike a failed
// static import. If sharp fails to load OR fails during processing, for ANY
// reason, this returns the ORIGINAL bytes/content-type unchanged rather than
// throwing — the upload still succeeds, just without the optimization.
//
// sharpLoader is injectable (defaults to a real dynamic import of "sharp")
// specifically so this guarantee is unit-testable with a FORCED failure —
// see processImage.test.ts, which proves the fallback actually engages
// rather than just asserting the try/catch exists. Do not remove the
// fallback or make compression a required step.
// ─────────────────────────────────────────────────────────────────────────
export async function processImage(
  buffer: Uint8Array,
  originalContentType: string,
  originalExtension: string,
  isAnimated: boolean,
  sharpLoader: () => Promise<typeof import("sharp")> = () => import("sharp")
): Promise<ProcessImageResult> {
  try {
    const sharp = (await sharpLoader()).default;
    // Capped at 800px (down from 1920px) as of 2026-07-16: with Next's image
    // optimizer off site-wide (see next.config.ts -- Vercel's optimization
    // quota is exhausted and the client can't currently pay to raise it),
    // every image now renders at exactly this stored resolution everywhere
    // it's used, from a 56px admin thumbnail up to the largest real display
    // size on the site -- the product detail page's photo, shown at 320px
    // CSS width (app/product/[id]/page.tsx). 800px covers that with headroom
    // for ~2.5x-density retina screens, while cutting the bytes every
    // smaller card/thumbnail downloads by more than half versus 1920px.
    const processed = await sharp(buffer, { animated: isAnimated })
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    return { buffer: processed, contentType: "image/webp", extension: "webp" };
  } catch (err) {
    console.error("[image] sharp unavailable/failed — falling back to the original image unprocessed:", err);
    return { buffer, contentType: originalContentType, extension: originalExtension };
  }
}
