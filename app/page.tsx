import SiteHeader from "@/components/home/SiteHeader";
import NavBar from "@/components/home/NavBar";
import Hero from "@/components/home/Hero";
import CategoryStrip from "@/components/home/CategoryStrip";
import WeeklyBestSeller from "@/components/home/WeeklyBestSeller";
import FeatureBand from "@/components/home/FeatureBand";
import DealsOfTheDay from "@/components/home/DealsOfTheDay";
import WeekendBanner from "@/components/home/WeekendBanner";
import CollectionGrid, { type CollectionPanel } from "@/components/home/CollectionGrid";
import MapSection from "@/components/home/MapSection";
import Gallery from "@/components/home/Gallery";
import ScrollToHash from "@/components/home/ScrollToHash";
import Footer from "@/components/home/Footer";
import { getFeaturedProducts, getSectionContent } from "@/lib/cms/getSectionContent";
import { map } from "@/content/homepage";
import type {
  Category,
  Feature,
  GalleryContent,
  HeroContent,
  WeekendBannerContent,
} from "@/content/homepage";

interface HeadingContent {
  heading?: string;
}

interface CollectionSectionContent {
  heading?: string;
  seeMoreLabel?: string;
}

export default async function Home() {
  const [
    hero,
    categoryStrip,
    weeklyBestSeller,
    weeklyBestSellerProducts,
    dealsOfTheDay,
    dealsOfTheDayProducts,
    weekendBanner,
    recentlyAdded,
    recentlyAddedProducts,
    topSelling,
    topSellingProducts,
    topRated,
    topRatedProducts,
    featureBand,
    gallery,
  ] = await Promise.all([
    getSectionContent<HeroContent>("home", "hero"),
    getSectionContent<{ categories: Category[] }>("home", "category_strip"),
    getSectionContent<HeadingContent>("home", "weekly_best_seller"),
    getFeaturedProducts("weekly_best_seller"),
    getSectionContent<HeadingContent>("home", "deals_of_the_day"),
    getFeaturedProducts("deals_of_the_day"),
    getSectionContent<WeekendBannerContent>("home", "weekend_banner"),
    getSectionContent<CollectionSectionContent>("home", "recently_added"),
    getFeaturedProducts("recently_added"),
    getSectionContent<CollectionSectionContent>("home", "top_selling"),
    getFeaturedProducts("top_selling"),
    getSectionContent<CollectionSectionContent>("home", "top_rated"),
    getFeaturedProducts("top_rated"),
    getSectionContent<{ features: Feature[] }>("home", "feature_band"),
    getSectionContent<GalleryContent>("home", "gallery"),
  ]);

  const collectionPanels: CollectionPanel[] = [
    {
      key: "recently_added",
      heading: recentlyAdded?.content.heading,
      seeMoreLabel: recentlyAdded?.content.seeMoreLabel,
      products: recentlyAdded ? recentlyAddedProducts : [],
    },
    {
      key: "top_selling",
      heading: topSelling?.content.heading,
      seeMoreLabel: topSelling?.content.seeMoreLabel,
      products: topSelling ? topSellingProducts : [],
    },
    {
      key: "top_rated",
      heading: topRated?.content.heading,
      seeMoreLabel: topRated?.content.seeMoreLabel,
      products: topRated ? topRatedProducts : [],
    },
  ];

  return (
    <>
      <SiteHeader />
      <NavBar />
      <main>
        {hero && <Hero content={hero.content} />}
        {categoryStrip && <CategoryStrip categories={categoryStrip.content.categories} />}
        {weeklyBestSeller && (
          <WeeklyBestSeller
            heading={weeklyBestSeller.content.heading}
            products={weeklyBestSellerProducts}
          />
        )}
        {dealsOfTheDay && (
          <DealsOfTheDay
            heading={dealsOfTheDay.content.heading}
            products={dealsOfTheDayProducts}
          />
        )}
        {weekendBanner && <WeekendBanner content={weekendBanner.content} />}
        <CollectionGrid panels={collectionPanels} />
        {featureBand && <FeatureBand features={featureBand.content.features} />}
        <MapSection content={map} />
        {gallery && <Gallery content={gallery.content} />}
      </main>
      <ScrollToHash />
      <Footer />
    </>
  );
}
