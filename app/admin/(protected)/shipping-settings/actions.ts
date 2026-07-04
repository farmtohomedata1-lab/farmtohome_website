"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuthedUser } from "@/lib/auth/session";

export async function updateSiteSettings(
  id: string,
  values: {
    freeShippingThreshold: number;
    standardDeliveryFee: number;
    paynowQrImageUrl: string;
  }
): Promise<{ error?: string }> {
  await requireAuthedUser();

  if (values.freeShippingThreshold < 0 || values.standardDeliveryFee < 0) {
    return { error: "Values can't be negative." };
  }

  try {
    await prisma.siteSettings.update({
      where: { id },
      data: {
        freeShippingThreshold: values.freeShippingThreshold,
        standardDeliveryFee: values.standardDeliveryFee,
        paynowQrImageUrl: values.paynowQrImageUrl.trim() || null,
      },
    });
  } catch (err) {
    console.error("[shipping-settings] updateSiteSettings failed:", err);
    return { error: "Failed to save. Please try again." };
  }

  // /checkout and /order-confirmation/[id] both read the authenticated
  // customer's cookies, which already makes them fully dynamic (never
  // statically cached) — only /cart needs an explicit revalidate here.
  revalidatePath("/cart");
  return {};
}
