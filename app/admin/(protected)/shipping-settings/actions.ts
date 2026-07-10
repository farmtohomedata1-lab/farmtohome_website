"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "@/lib/cache/safeRevalidate";
import { prisma } from "@/lib/prisma";
import { requireAuthedUser } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/audit/log";

export async function updateSiteSettings(
  id: string,
  values: {
    freeShippingThreshold: number;
    standardDeliveryFee: number;
    paynowQrImageUrl: string;
    taxEnabled: boolean;
    taxPercentage: number;
  }
): Promise<{ error?: string }> {
  const admin = await requireAuthedUser();

  if (values.freeShippingThreshold < 0 || values.standardDeliveryFee < 0) {
    return { error: "Values can't be negative." };
  }
  if (values.taxPercentage < 0) {
    return { error: "Tax percentage can't be negative." };
  }

  try {
    await prisma.siteSettings.update({
      where: { id },
      data: {
        freeShippingThreshold: values.freeShippingThreshold,
        standardDeliveryFee: values.standardDeliveryFee,
        paynowQrImageUrl: values.paynowQrImageUrl.trim() || null,
        taxEnabled: values.taxEnabled,
        taxPercentage: values.taxPercentage,
      },
    });
  } catch (err) {
    console.error("[shipping-settings] updateSiteSettings failed:", err);
    Sentry.captureException(err);
    return { error: "Failed to save. Please try again." };
  }

  await logAdminAction(admin.email ?? "unknown", {
    action: "settings.updated",
    targetType: "SiteSettings",
    targetId: id,
    metadata: {
      freeShippingThreshold: values.freeShippingThreshold,
      standardDeliveryFee: values.standardDeliveryFee,
      taxEnabled: values.taxEnabled,
      taxPercentage: values.taxPercentage,
    },
  });
  // /checkout and /order-confirmation/[id] both read the authenticated
  // customer's cookies, which already makes them fully dynamic (never
  // statically cached) — only /cart needs an explicit revalidate here.
  revalidatePath("/cart");
  return {};
}
