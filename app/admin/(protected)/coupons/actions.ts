"use server";

import { prisma } from "@/lib/prisma";
import { requireAuthedUser } from "@/lib/auth/session";

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
  await requireAuthedUser();

  const validationError = validate(values);
  if (validationError) return { error: validationError };

  try {
    await prisma.coupon.create({
      data: {
        code: values.code.trim().toUpperCase(),
        discountType: values.discountType,
        discountValue: values.discountValue,
        active: values.active,
        startDate: toStartOfDay(values.startDate),
        endDate: toEndOfDay(values.endDate),
      },
    });
  } catch (err) {
    console.error("[coupons] createCoupon failed:", err);
    return { error: "Failed to create coupon. That code may already exist." };
  }

  return {};
}

export async function updateCoupon(
  couponId: string,
  values: CouponFormValues
): Promise<{ error?: string }> {
  await requireAuthedUser();

  const validationError = validate(values);
  if (validationError) return { error: validationError };

  try {
    await prisma.coupon.update({
      where: { id: couponId },
      data: {
        code: values.code.trim().toUpperCase(),
        discountType: values.discountType,
        discountValue: values.discountValue,
        active: values.active,
        startDate: toStartOfDay(values.startDate),
        endDate: toEndOfDay(values.endDate),
      },
    });
  } catch (err) {
    console.error(`[coupons] updateCoupon(${couponId}) failed:`, err);
    return { error: "Failed to save coupon. That code may already exist." };
  }

  return {};
}

export async function deleteCoupon(couponId: string): Promise<{ error?: string }> {
  await requireAuthedUser();

  try {
    await prisma.coupon.delete({ where: { id: couponId } });
  } catch (err) {
    console.error(`[coupons] deleteCoupon(${couponId}) failed:`, err);
    return { error: "Failed to delete coupon. Please try again." };
  }

  return {};
}
