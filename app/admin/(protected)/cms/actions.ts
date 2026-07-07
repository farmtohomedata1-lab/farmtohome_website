"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuthedUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit/log";

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
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

// Deliberately no SVG here (it was removed, not just "not added"). SVG is
// XML and can carry a <script> or an onload= handler — the actual browser
// behavior when it's rendered depends entirely on how it ends up served
// (whether the raw file is ever opened directly, embedded via <object>,
// etc.), and that's more risk than a grocery site's CMS images need to
// carry for a format nothing here actually requires. Every image field in
// this app is a photo (hero banners, products, team portraits) — all
// naturally raster content.
type SniffedImageType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";
const EXTENSION_FOR_TYPE: Record<SniffedImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// Identifies the file from its actual leading bytes ("magic numbers"),
// never from the browser-supplied `file.type` or the filename's extension —
// both are just claims the client makes about itself and can be spoofed
// trivially (rename evil.exe to evil.png and most browsers will report
// `type: "image/png"` based on the extension alone). This is the same
// principle as "never trust client-supplied price" elsewhere in this app,
// applied to file uploads.
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
    return { error: "Image is too large (max 5MB)." };
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  const sniffedType = sniffImageType(buffer);
  if (!sniffedType) {
    return { error: "Unsupported or invalid image file. Use JPG, PNG, WEBP, or GIF." };
  }

  try {
    const admin = createAdminClient();
    // Extension and Content-Type both come from the sniffed type, never
    // from the client-supplied filename/MIME claim.
    const path = `${crypto.randomUUID()}.${EXTENSION_FOR_TYPE[sniffedType]}`;

    const { error: uploadError } = await admin.storage
      .from(UPLOAD_BUCKET)
      .upload(path, buffer, { contentType: sniffedType, upsert: false });

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
