import { prisma } from "@/lib/prisma";
import ShippingSettingsClient from "./ShippingSettingsClient";

export default async function ShippingSettingsPage() {
  // Self-healing: this row is a singleton seeded once, but if it's ever
  // missing (e.g. a fresh environment where the seed script wasn't run),
  // create it here with schema defaults so there's always something to edit
  // without needing manual DB access.
  let settings = await prisma.siteSettings.findFirst();
  if (!settings) {
    settings = await prisma.siteSettings.create({ data: {} });
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Shipping Settings</h1>
      <p className="mt-1 text-sm text-gray-500">
        Controls the free shipping progress bar and delivery fee shown on the Cart page.
      </p>

      <ShippingSettingsClient
        id={settings.id}
        freeShippingThreshold={settings.freeShippingThreshold.toNumber()}
        standardDeliveryFee={settings.standardDeliveryFee.toNumber()}
        paynowQrImageUrl={settings.paynowQrImageUrl ?? ""}
      />
    </div>
  );
}
