"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "@/lib/cache/safeRevalidate";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuthedUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit/log";
import { processImage } from "@/lib/image/processImage";

function pathForPage(page: string): string {
  return page === "home" ? "/" : `/${page}`;
}

export interface SectionIdentity {
  page: string;
  sectionKey: string;
  label: string;
  sortOrder: number;
}

export async function saveSectionContent(
  section: SectionIdentity,
  content: Record<string, unknown>
): Promise<{ error?: string }> {
  // Re-verify the session on every write — middleware only guards page
  // navigation, not the action call itself.
  const admin = await requireAuthedUser();

  try {
    // Upsert (not update) so saving a section that was added to
    // sections.config.ts after the last seed run doesn't 500 — it just
    // creates the row on first save instead.
    await prisma.pageSection.upsert({
      where: { page_sectionKey: { page: section.page, sectionKey: section.sectionKey } },
      create: {
        page: section.page,
        sectionKey: section.sectionKey,
        label: section.label,
        sortOrder: section.sortOrder,
        content: content as unknown as Prisma.InputJsonValue,
      },
      update: { content: content as unknown as Prisma.InputJsonValue },
    });
  } catch (err) {
    console.error(`[cms] saveSectionContent(${section.page}, ${section.sectionKey}) failed:`, err);
    Sentry.captureException(err);
    return { error: "Failed to save. Please try again." };
  }

  // Deliberately no content snapshot here — CMS content blobs can be large
  // and this is meant to answer "who touched what, when," not store a full
  // revision history.
  await logAdminAction(admin.email ?? "unknown", {
    action: "cms.section_saved",
    targetType: "PageSection",
    targetId: `${section.page}/${section.sectionKey}`,
    metadata: { label: section.label },
  });
  revalidatePath(pathForPage(section.page));
  return {};
}

export async function toggleSectionEnabled(
  section: SectionIdentity,
  enabled: boolean
): Promise<{ error?: string }> {
  const admin = await requireAuthedUser();

  try {
    await prisma.pageSection.upsert({
      where: { page_sectionKey: { page: section.page, sectionKey: section.sectionKey } },
      create: {
        page: section.page,
        sectionKey: section.sectionKey,
        label: section.label,
        sortOrder: section.sortOrder,
        enabled,
        content: {},
      },
      update: { enabled },
    });
  } catch (err) {
    console.error(`[cms] toggleSectionEnabled(${section.page}, ${section.sectionKey}) failed:`, err);
    Sentry.captureException(err);
    return { error: "Failed to update. Please try again." };
  }

  await logAdminAction(admin.email ?? "unknown", {
    action: "cms.section_toggled",
    targetType: "PageSection",
    targetId: `${section.page}/${section.sectionKey}`,
    metadata: { label: section.label, enabled },
  });
  revalidatePath(pathForPage(section.page));
  return {};
}

const UPLOAD_BUCKET = "cms-images";
// Raised from 5MB: a modern phone photo (uncompressed screenshot, portrait-
// mode JPEG, etc.) can comfortably exceed 5MB before sharp ever gets a
// chance to compress it down. Kept well under next.config.ts's Server
// Actions bodySizeLimit (see there) so this check's own error message is
// what the admin sees, not a bare framework rejection.
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

// Deliberately no SVG here (it was removed, not just "not added"). SVG is
// XML and can carry a <script> or an onload= handler — the actual browser
// behavior when it's rendered depends entirely on how it ends up served
// (whether the raw file is ever opened directly, embedded via <object>,
// etc.), and that's more risk than a grocery site's CMS images need to
// carry for a format nothing here actually requires. Every image field in
// this app is a photo (hero banners, products, team portraits) — all
// naturally raster content.
//
// Also deliberately no HEIC/HEIF (the actual format an iPhone camera saves
// by default): confirmed directly against this project's installed sharp
// build (`sharp.format.heif.input.fileSuffix`) that it only decodes the
// royalty-free AVIF variant, not Apple's patent-encumbered HEIC codec —
// claiming to accept it would silently produce a broken, undecodable image
// instead of a clear error. AVIF and TIFF are both confirmed genuinely
// supported end-to-end by this exact sharp build and are included below.
type SniffedImageType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/gif"
  | "image/avif"
  | "image/tiff";

// Identifies the file from its actual leading bytes ("magic numbers"),
// never from the browser-supplied `file.type` or the filename's extension —
// both are just claims the client makes about itself and can be spoofed
// trivially (rename evil.exe to evil.png and most browsers will report
// `type: "image/png"` based on the extension alone). This is the same
// principle as "never trust client-supplied price" elsewhere in this app,
// applied to file uploads.
const EXTENSION_FOR_TYPE: Record<SniffedImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/tiff": "tiff",
};

function sniffImageType(bytes: Uint8Array): SniffedImageType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 && // "RIFF"
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50 // "WEBP"
  ) {
    return "image/webp";
  }
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 && // "GIF8"
    (bytes[4] === 0x37 || bytes[4] === 0x39) && // '7' or '9'
    bytes[5] === 0x61 // 'a'
  ) {
    return "image/gif";
  }
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70 && // "ftyp"
    bytes[8] === 0x61 &&
    bytes[9] === 0x76 &&
    bytes[10] === 0x69 &&
    (bytes[11] === 0x66 || bytes[11] === 0x73) // "avif" (still) or "avis" (sequence)
  ) {
    return "image/avif";
  }
  if (
    bytes.length >= 4 &&
    ((bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) || // "II*\0" little-endian
      (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a)) // "MM\0*" big-endian
  ) {
    return "image/tiff";
  }
  return null;
}

// Not audit-logged: uploading a file only stages it in Storage and hands
// back a URL — it isn't itself a content change until saveSectionContent
// (the "Save" button) persists that URL into a section, which is logged.
export async function uploadSectionImage(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  await requireAuthedUser();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "No file provided." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "Image is too large (max 15MB)." };
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  const sniffedType = sniffImageType(buffer);
  if (!sniffedType) {
    return {
      error:
        "Unsupported or invalid image file. Use JPG, PNG, WEBP, GIF, AVIF, or TIFF. " +
        "(iPhone HEIC photos aren't supported yet — set your iPhone's camera to \"Most Compatible\" in Settings > Camera > Formats, or share as JPEG/PNG.)",
    };
  }

  // Compression/resize is a nice-to-have that silently degrades — never a
  // hard dependency for the upload to succeed. See lib/image/processImage.ts
  // for the full incident history and why this must use a dynamic import,
  // not a static one, to make a sharp load failure catchable at all.
  const { buffer: processed, contentType, extension } = await processImage(
    buffer,
    sniffedType,
    EXTENSION_FOR_TYPE[sniffedType],
    sniffedType === "image/gif"
  );

  try {
    const admin = createAdminClient();
    const path = `${crypto.randomUUID()}.${extension}`;

    // Confirmed root cause of uploaded images silently corrupting (bytes
    // ballooning ~1.8x and full of U+FFFD replacement characters — the
    // exact signature of binary data getting round-tripped through a text
    // encoding): passing a raw Buffer/Uint8Array as the request body here
    // goes through Next.js's globally-patched `fetch` (installed for its
    // Data Cache, confirmed live via `fetch.toString()` showing wrapped, not
    // native, code) — which mishandles raw binary bodies. Wrapping the exact
    // same bytes in a Blob first was proven, via a controlled A/B upload of
    // the same buffer both ways, to come back byte-identical every time;
    // the raw-Buffer path never does.
    // The `as unknown as BlobPart` below is a pure type-level cast: Node's
    // Buffer/Uint8Array is a real, valid Blob part at runtime (this is
    // exactly what the fix above relies on) — TS's DOM lib types Blob's
    // constructor against a Uint8Array<ArrayBuffer> specifically, which
    // doesn't structurally match Uint8Array<ArrayBufferLike> (the type
    // sharp's .toBuffer() and Node's Buffer carry, since ArrayBufferLike
    // also covers SharedArrayBuffer).
    const { error: uploadError } = await admin.storage
      .from(UPLOAD_BUCKET)
      .upload(path, new Blob([processed as unknown as BlobPart], { type: contentType }), {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("[cms] image upload failed:", uploadError);
      Sentry.captureException(uploadError);
      return { error: "Upload failed. Please try again." };
    }

    const { data } = admin.storage.from(UPLOAD_BUCKET).getPublicUrl(path);
    return { url: data.publicUrl };
  } catch (err) {
    console.error("[cms] image upload threw:", err);
    Sentry.captureException(err);
    return { error: "Upload failed. Please try again." };
  }
}
