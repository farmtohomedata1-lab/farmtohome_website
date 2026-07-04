"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuthedUser } from "@/lib/auth/session";

// Brands drive the /shop sidebar filter — any change should reflect there
// immediately, plus the admin product form's brand dropdown.
function revalidateStorefront() {
  revalidatePath("/shop");
  revalidatePath("/admin/products");
}

export async function createBrand(name: string): Promise<{ error?: string }> {
  await requireAuthedUser();

  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required." };

  try {
    await prisma.brand.create({ data: { name: trimmed } });
  } catch (err) {
    console.error("[brands] createBrand failed:", err);
    return { error: "Failed to create brand. It may already exist." };
  }

  revalidateStorefront();
  return {};
}

export async function updateBrand(brandId: string, name: string): Promise<{ error?: string }> {
  await requireAuthedUser();

  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required." };

  try {
    await prisma.brand.update({ where: { id: brandId }, data: { name: trimmed } });
  } catch (err) {
    console.error(`[brands] updateBrand(${brandId}) failed:`, err);
    return { error: "Failed to save brand. Name may already exist." };
  }

  revalidateStorefront();
  return {};
}

export async function deleteBrand(brandId: string): Promise<{ error?: string }> {
  await requireAuthedUser();

  try {
    await prisma.brand.delete({ where: { id: brandId } });
  } catch (err) {
    console.error(`[brands] deleteBrand(${brandId}) failed:`, err);
    return { error: "Failed to delete brand. Please try again." };
  }

  revalidateStorefront();
  return {};
}
