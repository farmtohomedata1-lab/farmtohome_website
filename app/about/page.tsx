import type { Metadata } from "next";
import TopBar from "@/components/home/TopBar";
import SiteHeader from "@/components/home/SiteHeader";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";
import FeatureBand from "@/components/home/FeatureBand";
import AboutHero from "@/components/about/AboutHero";
import StatsBar from "@/components/about/StatsBar";
import DestinationSection from "@/components/about/DestinationSection";
import TeamSection from "@/components/about/TeamSection";
import WhyChooseUs from "@/components/about/WhyChooseUs";
import Testimonials from "@/components/about/Testimonials";
import { getSectionContent } from "@/lib/cms/getSectionContent";
import type {
  AboutHeroContent,
  DestinationContent,
  StatItem,
  TeamSectionContent,
  TestimonialsContent,
  WhyChooseContent,
} from "@/content/about";
import type { Feature } from "@/content/homepage";

export const metadata: Metadata = {
  title: "About Us | Farm To Home",
  description:
    "Get to know Farm To Home — a neighborhood grocery store bringing fresh, organic produce and pantry essentials to your door across Singapore.",
};

export default async function AboutPage() {
  const [hero, statsBar, destination, team, whyChooseUs, testimonials, featureBand] =
    await Promise.all([
      getSectionContent<AboutHeroContent>("about", "hero"),
      getSectionContent<{ stats: StatItem[] }>("about", "stats_bar"),
      getSectionContent<DestinationContent>("about", "destination"),
      getSectionContent<Omit<TeamSectionContent, "show">>("about", "team"),
      getSectionContent<WhyChooseContent>("about", "why_choose_us"),
      getSectionContent<TestimonialsContent>("about", "testimonials"),
      getSectionContent<{ features: Feature[] }>("about", "feature_band"),
    ]);

  return (
    <>
      <TopBar />
      <SiteHeader />
      <NavBar />
      <main>
        {hero && <AboutHero content={hero.content} />}
        {statsBar && <StatsBar stats={statsBar.content.stats} />}
        {destination && <DestinationSection content={destination.content} />}
        {team && <TeamSection content={team.content} />}
        {whyChooseUs && <WhyChooseUs content={whyChooseUs.content} />}
        {testimonials && <Testimonials content={testimonials.content} />}
        {featureBand && <FeatureBand features={featureBand.content.features} />}
      </main>
      <Footer />
    </>
  );
}
