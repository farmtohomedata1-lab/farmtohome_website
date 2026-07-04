import type { Metadata } from "next";
import TopBar from "@/components/home/TopBar";
import SiteHeader from "@/components/home/SiteHeader";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";
import FeatureBand from "@/components/home/FeatureBand";
import PageHero from "@/components/common/PageHero";
import WishlistClient from "@/components/wishlist/WishlistClient";
import { getSectionContent } from "@/lib/cms/getSectionContent";
import type { Feature } from "@/content/homepage";

export const metadata: Metadata = {
  title: "My Wishlist | Farm To Home",
  description: "Products you've saved for later.",
};

interface WishlistHeroContent {
  heading: string;
  breadcrumbLabel: string;
}

export default async function WishlistPage() {
  const [hero, featureBand] = await Promise.all([
    getSectionContent<WishlistHeroContent>("wishlist", "hero"),
    getSectionContent<{ features: Feature[] }>("wishlist", "feature_band"),
  ]);

  return (
    <>
      <TopBar />
      <SiteHeader />
      <NavBar />
      <main>
        <PageHero
          heading={hero?.content.heading ?? "My Wishlist"}
          breadcrumbLabel={hero?.content.breadcrumbLabel ?? "Wishlist"}
        />
        <WishlistClient />
        {featureBand && <FeatureBand features={featureBand.content.features} />}
      </main>
      <Footer />
    </>
  );
}
