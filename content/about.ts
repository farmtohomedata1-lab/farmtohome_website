// Single source of truth for the About Us page copy and data.
// Components under components/about/ import from here — no hardcoded strings in JSX.
import type { Feature } from "./homepage";

// Real placeholder photography (Unsplash, individually content-verified —
// each photo ID below was downloaded and visually checked to match its slot)
// until the client supplies actual store/team photos.
const img = (photoId: string, w = 400, h = 400) =>
  `https://images.unsplash.com/photo-${photoId}?w=${w}&h=${h}&fit=crop&q=80`;

const photo = {
  storeInterior: "1607349913338-fca6f7fc42d0", // wooden shop baskets of fresh vegetables
  groceriesBag: "1543168256-418811576931", // fresh groceries unpacked on a table
  ownerPortrait: "1573497019940-1c28c88b4f3e", // smiling woman, professional portrait
  deliveryPortrait: "1552058544-f2b08422138a", // bearded man portrait
  sourcingPortrait: "1577219491135-ce391730fb2c", // person working hands-on with food
  supportPortrait: "1580489944761-15a19d654956", // smiling woman portrait
  testimonialAvatar1: "1508214751196-bcfd4ca60f91", // smiling blonde woman
  testimonialAvatar2: "1544725176-7c40e5a71c5e", // smiling dark-haired woman
} as const;

export interface AboutHeroContent {
  backgroundImage: string;
  imageAlt: string;
  heading: string;
  description: string;
  cta: string;
  ctaHref: string;
}

export interface StatItem {
  id: string;
  value: string;
  label: string;
}

export interface DestinationContent {
  image: string;
  imageAlt: string;
  heading: string;
  description: string;
  bullets: string[];
}

export interface TeamMember {
  id: string;
  photo: string;
  imageAlt: string;
  name: string;
  role: string;
}

export interface TeamSectionContent {
  show: boolean;
  heading: string;
  subtext: string;
  members: TeamMember[];
}

export type WhyChooseIconName = "organic" | "delivery" | "trust";

export interface WhyChooseCard {
  id: string;
  number: string;
  icon: WhyChooseIconName;
  title: string;
  description: string;
}

export interface WhyChooseContent {
  heading: string;
  subtext: string;
  cards: WhyChooseCard[];
}

export interface Testimonial {
  id: string;
  avatar: string;
  imageAlt: string;
  name: string;
  role: string;
  quote: string;
}

export interface TestimonialsContent {
  heading: string;
  testimonials: Testimonial[];
}

export const aboutHero: AboutHeroContent = {
  backgroundImage: img(photo.storeInterior, 1600, 700),
  imageAlt: "Fresh produce shelves inside our grocery store",
  heading: "Do You Want To Know Us?",
  description:
    "We're a neighborhood grocery store bringing fresh, organic produce and everyday pantry essentials straight to your door across Singapore. Here's a bit about who we are and why we do this.",
  cta: "Contact Us",
  ctaHref: "/contact",
};

export const stats: StatItem[] = [
  { id: "stat-products", value: "500+", label: "Products In Stock" },
  { id: "stat-delivery", value: "Same-Day", label: "Delivery Service" },
  { id: "stat-rating", value: "5★", label: "Rated Service" },
  { id: "stat-stock", value: "Fresh", label: "Daily Stock" },
];

export const destination: DestinationContent = {
  image: img(photo.groceriesBag, 600, 520),
  imageAlt: "Fresh groceries including fruit, bread, and vegetables",
  heading: "Your Destination for Quality Produce and Pantry Essentials",
  description:
    "From crisp vegetables to pantry staples, we hand-pick every order so your family gets the freshest groceries without the trip to the store. Order online and we'll take care of the rest.",
  bullets: [
    "Hand-picked fresh vegetables and fruit, sourced daily",
    "Pantry staples and household essentials in every order",
    "Cash on delivery — no card or app sign-up required",
    "Same-day delivery across Singapore for orders placed before 2pm",
    "Guest checkout available — no account needed to order",
    "Easy reordering and saved addresses for returning customers",
  ],
};

export const team: TeamSectionContent = {
  show: true,
  heading: "Meet Our Expert Team",
  subtext:
    "The people behind your weekly grocery run — sourcing, packing, and delivering with care.",
  members: [
    {
      id: "team-owner",
      photo: img(photo.ownerPortrait),
      imageAlt: "Portrait of the store owner",
      name: "Grace Lim",
      role: "Store Owner",
    },
    {
      id: "team-delivery",
      photo: img(photo.deliveryPortrait),
      imageAlt: "Portrait of the delivery lead",
      name: "Marcus Tan",
      role: "Delivery Lead",
    },
    {
      id: "team-sourcing",
      photo: img(photo.sourcingPortrait),
      imageAlt: "Portrait of the produce sourcing lead",
      name: "Daniel Yeo",
      role: "Produce Sourcing",
    },
    {
      id: "team-support",
      photo: img(photo.supportPortrait),
      imageAlt: "Portrait of the customer support lead",
      name: "Priya Nair",
      role: "Customer Support",
    },
  ],
};

export const whyChooseUs: WhyChooseContent = {
  heading: "Why You Choose Us?",
  subtext:
    "A small team focused on one thing: getting fresh groceries to your door, done right.",
  cards: [
    {
      id: "why-organic",
      number: "01",
      icon: "organic",
      title: "Fresh & Organic",
      description:
        "We source vegetables and fruit daily from trusted local suppliers, so every order arrives fresh, never stale.",
    },
    {
      id: "why-delivery",
      number: "02",
      icon: "delivery",
      title: "Fast Local Delivery",
      description:
        "Same-day delivery across Singapore for orders placed before 2pm, with cash on delivery — no app or card needed.",
    },
    {
      id: "why-trust",
      number: "03",
      icon: "trust",
      title: "Trusted Neighborhood Store",
      description:
        "We're a local shop, not a faceless warehouse — real people picking, packing, and standing behind every order.",
    },
  ],
};

export const testimonials: TestimonialsContent = {
  heading: "Customer Feedbacks",
  testimonials: [
    {
      id: "testimonial-1",
      avatar: img(photo.testimonialAvatar1, 100, 100),
      imageAlt: "Portrait of Aisha Rahman",
      name: "Aisha Rahman",
      role: "Regular Customer",
      quote:
        "I order every week and the vegetables are always fresh. Delivery shows up on time and the cash-on-delivery option makes it so easy — no app to fuss with.",
    },
    {
      id: "testimonial-2",
      avatar: img(photo.testimonialAvatar2, 100, 100),
      imageAlt: "Portrait of Wei Ling Koh",
      name: "Wei Ling Koh",
      role: "Regular Customer",
      quote:
        "Switched from the supermarket because the produce here actually lasts. Guest checkout meant I could order in under a minute the first time, no account needed.",
    },
  ],
};

export const featureStrip: Feature[] = [
  {
    id: "about-feature-price",
    icon: "price",
    title: "Best Prices & Offers",
    description: "We prepared special discounts you on grocery products.",
  },
  {
    id: "about-feature-whatsapp",
    icon: "whatsapp",
    title: "WhatsApp Support Available",
    description: "Message us on WhatsApp anytime for quick help with your order.",
  },
  {
    id: "about-feature-support",
    icon: "support",
    title: "Support Available",
    description: "Reach us by phone or chat whenever you need help.",
  },
  {
    id: "about-feature-deals",
    icon: "deals",
    title: "Daily Deals",
    description: "Fresh discounts on grocery staples, updated every day.",
  },
];
