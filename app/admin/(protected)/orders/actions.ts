"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuthedUser } from "@/lib/auth/session";

// The ONLY code path anywhere in the app that ever sets paymentStatus to
// PAID for a manually-paid (PayNow) order. Customer-side, `declarePaymentMade`
// in app/checkout/actions.ts only ever touches customerDeclaredPaid — never
// this field — precisely so a customer can never mark their own order paid.
export async function markOrderPaid(orderId: string): Promise<{ error?: string }> {
  await requireAuthedUser();

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID" },
    });
  } catch (err) {
    console.error(`[admin/orders] markOrderPaid(${orderId}) failed:`, err);
    return { error: "Failed to update. Please try again." };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return {};
}
