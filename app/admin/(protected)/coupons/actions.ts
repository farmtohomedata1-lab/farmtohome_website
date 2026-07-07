"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuthedUser } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/audit/log";

export interface CouponFormValues {
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  active: boolean;
  startDate: string; // "" = no restriction, else "YYYY-MM-DD"
  endDate: string; // "" = no restriction, else "YYYY-MM-DD"
}

function validate(values: CouponFormValues): string | null {
  if (!values.code.trim()) return "Code is required.";
  if (!(values.discountValue > 0)) return "Discount value must be greater than 0.";
  if (values.discountType === "PERCENTAGE" && values.discountValue > 100) {
    return "A percentage discount can't be more than 100.";
  }
  if (values.startDate && values.endDate && values.startDate > values.endDate) {
    return "Start date must be before end date.";
  }
  return null;
}

// Start-of-day for startDate, end-of-day for endDate, so a coupon stays
// valid through the entire picked end day rather than expiring at its
// midnight.
function toStartOfDay(dateStr: string): Date | null {
  if (!dateStr) return null;
  return new Date(`${dateStr}T00:00:00.000`);
}
function toEndOfDay(dateStr: string): Date | null {
  if (!dateStr) return null;
  return new Date(`${dateStr}T23:59:59.999`);
}

export async function createCoupon(values: CouponFormValues): Promise<{ error?: string }> {
  const admin = await requireAuthedUser();

  const validationError = validate(values);
  if (validationError) return { error: validationError };

  const code = values.code.trim().toUpperCase();
  let coupon;
  try {
    coupon = await prisma.coupon.create({
      data: {
        code,
        discountType: values.discountType,
        discountValue: values.discountValue,
        active: values.active,
        startDate: toStartOfDay(values.startDate),
        endDate: toEndOfDay(values.endDate),
      },
    });
  } catch (err) {
    console.error("[coupons] createCoupon failed:", err);
    Sentry.captureException(err);
    return { error: "Failed to create coupon. That code may already exist." };
  }

  await logAdminAction(admin.email ?? "unknown", {
    action: "coupon.created",
    targetType: "Coupon",
    targetId: coupon.id,
    metadata: { code, discountType: values.discountType, discountValue: values.discountValue },
  });
  return {};
}

export async function updateCoupon(
  couponId: string,
  values: CouponFormValues
): Promise<{ error?: string }> {
  const admin = await requireAuthedUser();

  const validationError = validate(values);
  if (validationError) return { error: validationError };

  const code = values.code.trim().toUpperCase();
  try {
    await prisma.coupon.update({
      where: { id: couponId },
      data: {
        code,
        discountType: values.discountType,
        discountValue: values.discountValue,
        active: values.active,
        startDate: toStartOfDay(values.startDate),
        endDate: toEndOfDay(values.endDate),
      },
    });
  } catch (err) {
    console.error(`[coupons] updateCoupon(${couponId}) failed:`, err);
    Sentry.captureException(err);
    return { error: "Failed to save coupon. That code may already exist." };
  }

  await logAdminAction(admin.email ?? "unknown", {
    action: "coupon.updated",
    targetType: "Coupon",
    targetId: couponId,
    metadata: { code, discountType: values.discountType, discountValue: values.discountValue, active: values.active },
  });
  return {};
}

export async function deleteCoupon(couponId: string): Promise<{ error?: string }> {
  const admin = await requireAuthedUser();

  let deleted;
  try {
    deleted = await prisma.coupon.delete({ where: { id: couponId } });
  } catch (err) {
    console.error(`[coupons] deleteCoupon(${couponId}) failed:`, err);
    Sentry.captureException(err);
    return { error: "Failed to delete coupon. Please try again." };
  }

  await logAdminAction(admin.email ?? "unknown", {
    action: "coupon.deleted",
    targetType: "Coupon",
    targetId: couponId,
    metadata: { code: deleted.code },
  });
  return {};
}

// Site-wide kill switch, not a per-coupon field — when off, /cart and
// /checkout hide the coupon input entirely (see CouponForm call sites) and
// the server independently refuses any coupon code (see validateCoupon /
// placeOrder), not just a cosmetic UI hide.
export async function setCouponsEnabled(
  settingsId: string,
  enabled: boolean
): Promise<{ error?: string }> {
  const admin = await requireAuthedUser();

  try {
    await prisma.siteSettings.update({
      where: { id: settingsId },
      data: { couponsEnabled: enabled },
    });
  } catch (err) {
    console.error("[coupons] setCouponsEnabled failed:", err);
    Sentry.captureException(err);
    return { error: "Failed to save. Please try again." };
  }

  await logAdminAction(admin.email ?? "unknown", {
    action: "coupon.global_toggle",
    targetType: "SiteSettings",
    targetId: settingsId,
    metadata: { enabled },
  });
  revalidatePath("/cart");
  revalidatePath("/checkout");
  return {};
}
