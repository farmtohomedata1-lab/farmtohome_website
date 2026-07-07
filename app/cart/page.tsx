import type { Metadata } from "next";
import SiteHeader from "@/components/home/SiteHeader";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";
import FeatureBand from "@/components/home/FeatureBand";
import PageHero from "@/components/common/PageHero";
import CartClient from "@/components/cart/CartClient";
import { getSectionContent } from "@/lib/cms/getSectionContent";
import { prisma } from "@/lib/prisma";
import type { Feature } from "@/content/homepage";

export const metadata: Metadata = {
  title: "Your Cart | Farm To Home",
  description: "Review your cart, apply a coupon, and see your order total before checkout.",
};

interface CartHeroContent {
  heading: string;
  breadcrumbLabel: string;
}

// Schema defaults — used only if the SiteSettings singleton row is somehow
// missing, so this page never crashes waiting on it.
const DEFAULT_SITE_SETTINGS = {
  freeShippingThreshold: 80,
  standardDeliveryFee: 5,
  couponsEnabled: true,
  taxEnabled: false,
  taxPercentage: 9,
};

export default async function CartPage() {
  const [settings, hero, featureBand] = await Promise.all([
    prisma.siteSettings.findFirst(),
    getSectionContent<CartHeroContent>("cart", "hero"),
    getSectionContent<{ features: Feature[] }>("cart", "feature_band"),
  ]);

  const freeShippingThreshold =
    settings?.freeShippingThreshold.toNumber() ?? DEFAULT_SITE_SETTINGS.freeShippingThreshold;
  const standardDeliveryFee =
    settings?.standardDeliveryFee.toNumber() ?? DEFAULT_SITE_SETTINGS.standardDeliveryFee;
  const couponsEnabled = settings?.couponsEnabled ?? DEFAULT_SITE_SETTINGS.couponsEnabled;
  const taxEnabled = settings?.taxEnabled ?? DEFAULT_SITE_SETTINGS.taxEnabled;
  const taxPercentage = settings?.taxPercentage.toNumber() ?? DEFAULT_SITE_SETTINGS.taxPercentage;

  return (
    <>
      <SiteHeader />
      <NavBar />
      <main>
        <PageHero
          heading={hero?.content.heading ?? "Shopping Cart"}
          breadcrumbLabel={hero?.content.breadcrumbLabel ?? "Cart"}
        />
        <CartClient
          freeShippingThreshold={freeShippingThreshold}
          standardDeliveryFee={standardDeliveryFee}
          couponsEnabled={couponsEnabled}
          taxEnabled={taxEnabled}
          taxPercentage={taxPercentage}
        />
        {featureBand && <FeatureBand features={featureBand.content.features} />}
      </main>
      <Footer />
    </>
  );
}
