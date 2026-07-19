"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "@/lib/cache/safeRevalidate";
import { prisma } from "@/lib/prisma";
import { requireAuthedUser } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/audit/log";

// Categories drive the /shop sidebar filter — any change should reflect
// there immediately, plus the admin product form's category dropdown.
function revalidateStorefront() {
  revalidatePath("/shop");
  revalidatePath("/admin/products");
}

// Returns the real DB id on success — see the note on createProduct in
// app/admin/(protected)/products/actions.ts; without it the client tracks a
// just-added category by a fabricated id and can't delete/edit it until refresh.
export async function createCategory(name: string): Promise<{ error?: string; id?: string }> {
  const admin = await requireAuthedUser();

  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required." };

  let category;
  try {
    category = await prisma.category.create({ data: { name: trimmed } });
  } catch (err) {
    console.error("[categories] createCategory failed:", err);
    Sentry.captureException(err);
    return { error: "Failed to create category. It may already exist." };
  }

  await logAdminAction(admin.email ?? "unknown", {
    action: "category.created",
    targetType: "Category",
    targetId: category.id,
    metadata: { name: trimmed },
  });
  revalidateStorefront();
  return { id: category.id };
}

export async function updateCategory(
  categoryId: string,
  name: string
): Promise<{ error?: string }> {
  const admin = await requireAuthedUser();

  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required." };

  try {
    await prisma.category.update({ where: { id: categoryId }, data: { name: trimmed } });
  } catch (err) {
    console.error(`[categories] updateCategory(${categoryId}) failed:`, err);
    Sentry.captureException(err);
    return { error: "Failed to save category. Name may already exist." };
  }

  await logAdminAction(admin.email ?? "unknown", {
    action: "category.updated",
    targetType: "Category",
    targetId: categoryId,
    metadata: { name: trimmed },
  });
  revalidateStorefront();
  return {};
}

export async function deleteCategory(categoryId: string): Promise<{ error?: string }> {
  const admin = await requireAuthedUser();

  let deleted;
  try {
    deleted = await prisma.category.delete({ where: { id: categoryId } });
  } catch (err) {
    console.error(`[categories] deleteCategory(${categoryId}) failed:`, err);
    Sentry.captureException(err);
    return { error: "Failed to delete category. Please try again." };
  }

  await logAdminAction(admin.email ?? "unknown", {
    action: "category.deleted",
    targetType: "Category",
    targetId: categoryId,
    metadata: { name: deleted.name },
  });
  revalidateStorefront();
  return {};
}
