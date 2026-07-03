"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuthedUser } from "@/lib/auth/session";

// A product's tags decide which homepage sections it shows up in, so any
// change here can affect the live homepage — revalidate it too.
function revalidateStorefront() {
  revalidatePath("/");
}

export async function toggleProductTag(
  productId: string,
  tag: string,
  checked: boolean
): Promise<{ error?: string }> {
  await requireAuthedUser();

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return { error: "Product not found." };

    const nextTags = checked
      ? Array.from(new Set([...product.featuredTags, tag]))
      : product.featuredTags.filter((t) => t !== tag);

    await prisma.product.update({
      where: { id: productId },
      data: { featuredTags: nextTags },
    });
  } catch (err) {
    console.error(`[products] toggleProductTag(${productId}, ${tag}) failed:`, err);
    return { error: "Failed to update. Please try again." };
  }

  revalidateStorefront();
  return {};
}

export interface ProductFormValues {
  name: string;
  pack: string;
  price: string;
  oldPrice: string;
  rating: number;
  image: string;
}

export async function createProduct(values: ProductFormValues): Promise<{ error?: string }> {
  await requireAuthedUser();

  if (!values.name.trim() || !values.price.trim()) {
    return { error: "Name and price are required." };
  }

  try {
    await prisma.product.create({
      data: {
        name: values.name.trim(),
        pack: values.pack.trim() || null,
        price: values.price.trim(),
        oldPrice: values.oldPrice.trim() || null,
        rating: values.rating,
        image: values.image.trim() || null,
        featuredTags: [],
      },
    });
  } catch (err) {
    console.error("[products] createProduct failed:", err);
    return { error: "Failed to create product. Please try again." };
  }

  revalidateStorefront();
  return {};
}

export async function updateProduct(
  productId: string,
  values: ProductFormValues
): Promise<{ error?: string }> {
  await requireAuthedUser();

  if (!values.name.trim() || !values.price.trim()) {
    return { error: "Name and price are required." };
  }

  try {
    await prisma.product.update({
      where: { id: productId },
      data: {
        name: values.name.trim(),
        pack: values.pack.trim() || null,
        price: values.price.trim(),
        oldPrice: values.oldPrice.trim() || null,
        rating: values.rating,
        image: values.image.trim() || null,
      },
    });
  } catch (err) {
    console.error(`[products] updateProduct(${productId}) failed:`, err);
    return { error: "Failed to save product. Please try again." };
  }

  revalidateStorefront();
  return {};
}

export async function deleteProduct(productId: string): Promise<{ error?: string }> {
  await requireAuthedUser();

  try {
    await prisma.product.delete({ where: { id: productId } });
  } catch (err) {
    console.error(`[products] deleteProduct(${productId}) failed:`, err);
    return { error: "Failed to delete product. Please try again." };
  }

  revalidateStorefront();
  return {};
}
