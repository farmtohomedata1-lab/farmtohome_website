import type { Metadata } from "next";
import SiteHeader from "@/components/home/SiteHeader";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";
import PageHero from "@/components/common/PageHero";
import CheckoutClient from "@/components/checkout/CheckoutClient";
import { requireAuthedCustomer } from "@/lib/auth/customerSession";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Checkout | Farm To Home",
};

const DEFAULT_SITE_SETTINGS = { freeShippingThreshold: 80, standardDeliveryFee: 5, couponsEnabled: true };

export default async function CheckoutPage() {
  // Every visitor here is guaranteed logged in — proxy.ts already redirects
  // unauthenticated requests to /login?redirect=/checkout, and this re-check
  // is defense-in-depth (same pattern as the admin protected layout).
  const customer = await requireAuthedCustomer("/checkout");

  const [addresses, settings] = await Promise.all([
    prisma.address.findMany({
      where: { customerId: customer.id },
      orderBy: [{ isDefault: "desc" }, { id: "asc" }],
    }),
    prisma.siteSettings.findFirst(),
  ]);

  const freeShippingThreshold =
    settings?.freeShippingThreshold.toNumber() ?? DEFAULT_SITE_SETTINGS.freeShippingThreshold;
  const standardDeliveryFee =
    settings?.standardDeliveryFee.toNumber() ?? DEFAULT_SITE_SETTINGS.standardDeliveryFee;
  const couponsEnabled = settings?.couponsEnabled ?? DEFAULT_SITE_SETTINGS.couponsEnabled;

  return (
    <>
      <SiteHeader />
      <NavBar />
      <main>
        <PageHero heading="Checkout" breadcrumbLabel="Checkout" />
        <CheckoutClient
          addresses={addresses.map((a) => ({
            id: a.id,
            label: a.label ?? "",
            fullName: a.fullName,
            phone: a.phone,
            blockStreet: a.blockStreet,
            unitNumber: a.unitNumber ?? "",
            postalCode: a.postalCode,
            landmark: a.landmark ?? "",
            isDefault: a.isDefault,
          }))}
          freeShippingThreshold={freeShippingThreshold}
          standardDeliveryFee={standardDeliveryFee}
          couponsEnabled={couponsEnabled}
        />
      </main>
      <Footer />
    </>
  );
}
