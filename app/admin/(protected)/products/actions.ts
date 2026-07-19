"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "@/lib/cache/safeRevalidate";
import { prisma } from "@/lib/prisma";
import { requireAuthedUser } from "@/lib/auth/session";
import { computeIsOnSale } from "@/lib/pricing";
import { logAdminAction } from "@/lib/audit/log";

// A product's tags decide which homepage sections it shows up in, and its
// price/category/brand/stock fields drive /shop's filters — revalidate both.
function revalidateStorefront() {
  revalidatePath("/");
  revalidatePath("/shop");
}

export async function toggleProductTag(
  productId: string,
  tag: string,
  checked: boolean
): Promise<{ error?: string }> {
  const admin = await requireAuthedUser();

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
    Sentry.captureException(err);
    return { error: "Failed to update. Please try again." };
  }

  await logAdminAction(admin.email ?? "unknown", {
    action: "product.tag_toggled",
    targetType: "Product",
    targetId: productId,
    metadata: { tag, checked },
  });
  revalidateStorefront();
  return {};
}

export interface ProductFormValues {
  name: string;
  pack: string;
  price: number;
  compareAtPrice: number | null;
  discountActive: boolean;
  inStock: boolean;
  rating: number;
  image: string;
  categoryId: string; // "" = none
  brandId: string; // "" = none
  detailedDescription: string; // "" = none (renders no section on the PDP)
  chargeShipping: boolean;
  taxable: boolean;
  taxOverridePercent: number | null; // null = use SiteSettings.taxPercentage
  // Admin-side organization only (see schema.prisma) — never read by pricing,
  // cart, or checkout logic. A bundle is priced/checked out exactly like any
  // other product via this exact same create/update path.
  isBundle: boolean;
}

// Returns the real DB id on success so the client can track the just-created
// row by its actual primary key. Before this, the client fabricated a random
// UUID for the new row (it had no other id to use), so any later delete/edit/
// tag/image-replace on that in-session row targeted a non-existent id and
// failed with "Failed to delete product." until a full page refresh reloaded
// the real ids — the root cause of the "delete doesn't actually delete" and
// "can't replace the image on a just-added product" reports.
export async function createProduct(
  values: ProductFormValues
): Promise<{ error?: string; id?: string }> {
  const admin = await requireAuthedUser();

  if (!values.name.trim() || !(values.price > 0)) {
    return { error: "Name and a price greater than 0 are required." };
  }
  if (values.taxOverridePercent != null && values.taxOverridePercent < 0) {
    return { error: "Override tax percentage can't be negative." };
  }

  const isOnSale = computeIsOnSale(values);

  let product;
  try {
    product = await prisma.product.create({
      data: {
        name: values.name.trim(),
        pack: values.pack.trim() || null,
        price: values.price,
        compareAtPrice: values.compareAtPrice,
        discountActive: values.discountActive,
        isOnSale,
        inStock: values.inStock,
        rating: values.rating,
        image: values.image.trim() || null,
        detailedDescription: values.detailedDescription.trim() || null,
        featuredTags: [],
        categoryId: values.categoryId || null,
        brandId: values.brandId || null,
        chargeShipping: values.chargeShipping,
        taxable: values.taxable,
        taxOverridePercent: values.taxOverridePercent,
        isBundle: values.isBundle,
      },
    });
  } catch (err) {
    console.error("[products] createProduct failed:", err);
    Sentry.captureException(err);
    return { error: "Failed to create product. Please try again." };
  }

  await logAdminAction(admin.email ?? "unknown", {
    action: "product.created",
    targetType: "Product",
    targetId: product.id,
    metadata: { name: product.name, price: values.price },
  });
  revalidateStorefront();
  return { id: product.id };
}

export async function updateProduct(
  productId: string,
  values: ProductFormValues
): Promise<{ error?: string }> {
  const admin = await requireAuthedUser();

  if (!values.name.trim() || !(values.price > 0)) {
    return { error: "Name and a price greater than 0 are required." };
  }
  if (values.taxOverridePercent != null && values.taxOverridePercent < 0) {
    return { error: "Override tax percentage can't be negative." };
  }

  const isOnSale = computeIsOnSale(values);

  try {
    await prisma.product.update({
      where: { id: productId },
      data: {
        name: values.name.trim(),
        pack: values.pack.trim() || null,
        price: values.price,
        compareAtPrice: values.compareAtPrice,
        discountActive: values.discountActive,
        isOnSale,
        inStock: values.inStock,
        rating: values.rating,
        image: values.image.trim() || null,
        detailedDescription: values.detailedDescription.trim() || null,
        categoryId: values.categoryId || null,
        brandId: values.brandId || null,
        chargeShipping: values.chargeShipping,
        taxable: values.taxable,
        taxOverridePercent: values.taxOverridePercent,
        isBundle: values.isBundle,
      },
    });
  } catch (err) {
    console.error(`[products] updateProduct(${productId}) failed:`, err);
    Sentry.captureException(err);
    return { error: "Failed to save product. Please try again." };
  }

  await logAdminAction(admin.email ?? "unknown", {
    action: "product.updated",
    targetType: "Product",
    targetId: productId,
    metadata: { name: values.name.trim(), price: values.price },
  });
  revalidateStorefront();
  return {};
}

export async function deleteProduct(productId: string): Promise<{ error?: string }> {
  const admin = await requireAuthedUser();

  let deleted;
  try {
    deleted = await prisma.product.delete({ where: { id: productId } });
  } catch (err) {
    console.error(`[products] deleteProduct(${productId}) failed:`, err);
    Sentry.captureException(err);
    return { error: "Failed to delete product. Please try again." };
  }

  await logAdminAction(admin.email ?? "unknown", {
    action: "product.deleted",
    targetType: "Product",
    targetId: productId,
    metadata: { name: deleted.name },
  });
  revalidateStorefront();
  return {};
}
