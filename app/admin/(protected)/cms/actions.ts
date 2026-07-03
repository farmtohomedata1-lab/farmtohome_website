"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuthedUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

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
  await requireAuthedUser();

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
    return { error: "Failed to save. Please try again." };
  }

  revalidatePath(pathForPage(section.page));
  return {};
}

export async function toggleSectionEnabled(
  section: SectionIdentity,
  enabled: boolean
): Promise<{ error?: string }> {
  await requireAuthedUser();

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
    return { error: "Failed to update. Please try again." };
  }

  revalidatePath(pathForPage(section.page));
  return {};
}

const UPLOAD_BUCKET = "cms-images";
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

export async function uploadSectionImage(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  await requireAuthedUser();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "No file provided." };
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { error: "Unsupported file type. Use JPG, PNG, WEBP, GIF, or SVG." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "Image is too large (max 5MB)." };
  }

  try {
    const admin = createAdminClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from(UPLOAD_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("[cms] image upload failed:", uploadError);
      return { error: "Upload failed. Please try again." };
    }

    const { data } = admin.storage.from(UPLOAD_BUCKET).getPublicUrl(path);
    return { url: data.publicUrl };
  } catch (err) {
    console.error("[cms] image upload threw:", err);
    return { error: "Upload failed. Please try again." };
  }
}
