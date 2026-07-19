"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "@/lib/cache/safeRevalidate";
import { prisma } from "@/lib/prisma";
import { requireAuthedUser } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/audit/log";

// Brands drive the /shop sidebar filter — any change should reflect there
// immediately, plus the admin product form's brand dropdown.
function revalidateStorefront() {
  revalidatePath("/shop");
  revalidatePath("/admin/products");
}

// Returns the real DB id on success — see the note on createProduct in
// app/admin/(protected)/products/actions.ts; without it the client tracks a
// just-added brand by a fabricated id and can't delete/edit it until refresh.
export async function createBrand(name: string): Promise<{ error?: string; id?: string }> {
  const admin = await requireAuthedUser();

  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required." };

  let brand;
  try {
    brand = await prisma.brand.create({ data: { name: trimmed } });
  } catch (err) {
    console.error("[brands] createBrand failed:", err);
    Sentry.captureException(err);
    return { error: "Failed to create brand. It may already exist." };
  }

  await logAdminAction(admin.email ?? "unknown", {
    action: "brand.created",
    targetType: "Brand",
    targetId: brand.id,
    metadata: { name: trimmed },
  });
  revalidateStorefront();
  return { id: brand.id };
}

export async function updateBrand(brandId: string, name: string): Promise<{ error?: string }> {
  const admin = await requireAuthedUser();

  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required." };

  try {
    await prisma.brand.update({ where: { id: brandId }, data: { name: trimmed } });
  } catch (err) {
    console.error(`[brands] updateBrand(${brandId}) failed:`, err);
    Sentry.captureException(err);
    return { error: "Failed to save brand. Name may already exist." };
  }

  await logAdminAction(admin.email ?? "unknown", {
    action: "brand.updated",
    targetType: "Brand",
    targetId: brandId,
    metadata: { name: trimmed },
  });
  revalidateStorefront();
  return {};
}

export async function deleteBrand(brandId: string): Promise<{ error?: string }> {
  const admin = await requireAuthedUser();

  let deleted;
  try {
    deleted = await prisma.brand.delete({ where: { id: brandId } });
  } catch (err) {
    console.error(`[brands] deleteBrand(${brandId}) failed:`, err);
    Sentry.captureException(err);
    return { error: "Failed to delete brand. Please try again." };
  }

  await logAdminAction(admin.email ?? "unknown", {
    action: "brand.deleted",
    targetType: "Brand",
    targetId: brandId,
    metadata: { name: deleted.name },
  });
  revalidateStorefront();
  return {};
}
