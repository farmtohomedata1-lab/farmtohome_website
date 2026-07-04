"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuthedUser } from "@/lib/auth/session";

// Categories drive the /shop sidebar filter — any change should reflect
// there immediately, plus the admin product form's category dropdown.
function revalidateStorefront() {
  revalidatePath("/shop");
  revalidatePath("/admin/products");
}

export async function createCategory(name: string): Promise<{ error?: string }> {
  await requireAuthedUser();

  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required." };

  try {
    await prisma.category.create({ data: { name: trimmed } });
  } catch (err) {
    console.error("[categories] createCategory failed:", err);
    return { error: "Failed to create category. It may already exist." };
  }

  revalidateStorefront();
  return {};
}

export async function updateCategory(
  categoryId: string,
  name: string
): Promise<{ error?: string }> {
  await requireAuthedUser();

  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required." };

  try {
    await prisma.category.update({ where: { id: categoryId }, data: { name: trimmed } });
  } catch (err) {
    console.error(`[categories] updateCategory(${categoryId}) failed:`, err);
    return { error: "Failed to save category. Name may already exist." };
  }

  revalidateStorefront();
  return {};
}

export async function deleteCategory(categoryId: string): Promise<{ error?: string }> {
  await requireAuthedUser();

  try {
    await prisma.category.delete({ where: { id: categoryId } });
  } catch (err) {
    console.error(`[categories] deleteCategory(${categoryId}) failed:`, err);
    return { error: "Failed to delete category. Please try again." };
  }

  revalidateStorefront();
  return {};
}
