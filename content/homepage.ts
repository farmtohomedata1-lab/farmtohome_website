// Single source of truth for all homepage copy and data.
// Components under components/home/ import from here — no hardcoded strings in JSX.

// Real placeholder photography (Unsplash, individually content-verified —
// each photo ID below was downloaded and visually checked to match its slot)
// until the client supplies actual product shots.
const img = (photoId: string, w = 300, h = 300) =>
  `https://images.unsplash.com/photo-${photoId}?w=${w}&h=${h}&fit=crop&q=80`;

// Verified photo library — id: what it actually shows.
const photo = {
  vegSpreadDark: "1518843875459-f738682238a6", // red cabbage, tomatoes, eggplant, carrots
  groceryShelfVeg: "1607349913338-fca6f7fc42d0", // wooden shop baskets of fresh vegetables
  milkPour: "1550583724-b2692b85b150", // milk pouring into a glass
  chocolateBar: "1610450949065-1f2841536c88", // broken dark chocolate bar
  potatoes: "1518977676601-b53f82aba655", // pile of potatoes
  vegBoxBoard: "1610348725531-843dff563e2c", // peppers, carrots, garlic on a board
  pastaBowl: "1604908176997-125f25cc6f3d", // pasta salad bowl
  watermelon: "1587049352846-4a222e784d38", // whole watermelon + cut slice
  fruitPlatter: "1490474418585-ba9bad8fd0ea", // mixed fresh fruit platter
  cheeseWheel: "1452195100486-9cc805987862", // blue cheese wheel with figs
  breadLoaves: "1509440159596-0249088772ff", // rustic bread loaves
  chipsBags: "1566478989037-eec170784d0b", // stacked bags of baked chips
  saladBowl: "1540420773420-3366772f4999", // big fresh vegetable salad bowl
  onionsPile: "1580201092675-a0a6a6cafbb1", // pile of onions
  onionsPair: "1518977956812-cd3dbadaaf31", // two onions close-up
  spicesSpread: "1596040033229-a9821ebd058d", // assorted whole spices
  orangeTwig: "1547514701-42782101795e", // two oranges on the stem
  grapesDark: "1596363505729-4190a9506133", // bunch of dark grapes
  tomatoSingle: "1607305387299-a3d9611cd469", // single tomato on wood
  broccoliSingle: "1459411621453-7b03977f4bfc", // single broccoli floret
  pancakesStack: "1567620905732-2d1ec7ab7445", // stacked pancakes with syrup
  smoothieBowl: "1467453678174-768ec283a940", // fruit smoothie bowl + juice glass
  strawberriesPile: "1587393855524-087f83d95bc9", // pile of fresh strawberries
  yogurtBowl: "1571212515416-fef01fc43637", // bowl of cream/yogurt with herbs
  cabbages: "1594282486552-05b4d80fbb9f", // pile of green cabbages
  bibimbap: "1590301157890-4810ed352733", // colorful seasoned rice bowls
  candyBars: "1621939514649-280e2ee25f60", // pile of packaged chocolate bars
  burger: "1571091718767-18b5b1457add", // grocery-style burger with fresh veg
  grainBowl: "1547592180-85f173990554", // grain bowl with fresh vegetables
} as const;

export type FeatureIconName =
  | "payment"
  | "stocks"
  | "quality"
  | "delivery"
  | "price"
  | "returns"
  | "support"
  | "deals"
  | "whatsapp";

// Single source of truth for the real store address — used by both the
// footer contact block and the homepage map embed so they can never drift.
const STORE_ADDRESS =
  "218 Pasir Panjang Rd, #01-09 ICON@Pasir Panjang, Singapore 118579";

export type SocialIconName = "facebook" | "instagram";

export interface NavLink {
  label: string;
  href: string;
}

export interface HeaderContent {
  searchPlaceholder: string;
  searchButton: string;
  wishlist: string;
  cart: string;
}

export interface NavBarContent {
  links: NavLink[];
  delivery: string;
}

export interface HeroCarouselImage {
  id: string;
  image: string;
  imageAlt: string;
}

export interface HeroContent {
  eyebrow: string;
  heading: string;
  description: string;
  cta: string;
  priceLabel: string;
  price: string;
  image: string;
  imageAlt: string;
  // Absent/anything-but-"carousel" on existing (pre-this-feature) rows must
  // mean "static" — that's what every hero row already in the database has,
  // and it must keep rendering exactly as before with zero admin action.
  heroStyle?: "static" | "carousel";
  // Up to 5, admin-managed. 1-4 is fine (not required to be exactly 5); Hero
  // itself falls back to the static banner if this is empty while
  // heroStyle is "carousel" (see components/home/Hero.tsx).
  carouselImages?: HeroCarouselImage[];
}

export interface Category {
  id: string;
  name: string;
  items: string;
  image: string;
}

export interface SimpleProduct {
  id: string;
  name: string;
  price: string;
  image: string;
}

export interface Product {
  id: string;
  name: string;
  pack: string;
  price: string;
  oldPrice: string;
  rating: number;
  image: string;
}

export interface ProductCardLabels {
  saleTag: string;
  addToCart: string;
}

export interface Feature {
  id: string;
  icon: FeatureIconName;
  title: string;
  description: string;
}

export interface WeekendBannerContent {
  label: string;
  heading: string;
  description: string;
  image: string;
  imageAlt: string;
}

export interface CollectionSection {
  id: string;
  title: string;
  products: Product[];
}

export interface CollectionsContent {
  seeMore: string;
  sections: CollectionSection[];
}

export interface GalleryImage {
  id: string;
  image: string;
  imageAlt: string;
}

export interface GalleryContent {
  heading: string;
  images: GalleryImage[];
}

export interface MapContent {
  heading: string;
  address: string;
}

export interface FooterColumn {
  title: string;
  links: NavLink[];
}

export interface FooterContent {
  tagline: string;
  emailPlaceholder: string;
  socials: { id: SocialIconName; href: string }[];
  columns: FooterColumn[];
  help: {
    title: string;
    address: string;
    hours: string; // seed default — live value served from the "footer_contact" CMS section
    whatsappNumber: string; // seed default — live value served from the "footer_contact" CMS section; the ONE contact number on the site, never hardcode a duplicate elsewhere
  };
  copyright: string;
}

export const header: HeaderContent = {
  searchPlaceholder: "Search for products, categories",
  searchButton: "Search",
  wishlist: "Wishlist",
  cart: "My Cart",
};

export const navBar: NavBarContent = {
  links: [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Shop", href: "/shop" },
    { label: "Contact", href: "/contact" },
    { label: "Gallery", href: "/#gallery" },
  ],
  delivery: "Shipping within Singapore only",
};

export const hero: HeroContent = {
  eyebrow: "Get up to 30% off on your first $150 purchase",
  heading: "Feed Your Family at the Best Price",
  description:
    "We have prepared special discounts for you on grocery products. Don't miss these opportunities...",
  cta: "Shop Now",
  priceLabel: "from",
  price: "$80.99",
  image: img(photo.vegSpreadDark, 640, 440),
  imageAlt: "Fresh organic vegetables",
  heroStyle: "static",
  carouselImages: [],
};

const categoryImages: string[] = [
  photo.broccoliSingle,
  photo.strawberriesPile,
  photo.grapesDark,
  photo.vegBoxBoard,
  photo.orangeTwig,
  photo.tomatoSingle,
  photo.cabbages,
  photo.onionsPair,
];

export const categories: Category[] = categoryImages.map((photoId, i) => ({
  id: `category-${i + 1}`,
  name: "Organic Vegetable",
  items: "299 ITEMS",
  image: img(photoId, 120, 120),
}));

export const weeklyBestSeller: { heading: string; products: SimpleProduct[] } = {
  heading: "Weekly Best Seller Grocery",
  products: [
    { id: "weekly-1", name: "Super Fresh Meat", price: "$36.00", image: img(photo.breadLoaves) },
    { id: "weekly-2", name: "Super Fresh Meat", price: "$36.00", image: img(photo.grainBowl) },
    { id: "weekly-3", name: "Super Fresh Meat", price: "$36.00", image: img(photo.cheeseWheel) },
    { id: "weekly-4", name: "Super Fresh Meat", price: "$36.00", image: img(photo.milkPour) },
    { id: "weekly-5", name: "Super Fresh Meat", price: "$36.00", image: img(photo.yogurtBowl) },
    { id: "weekly-6", name: "Super Fresh Meat", price: "$36.00", image: img(photo.chocolateBar) },
  ],
};

export const features: Feature[] = [
  {
    id: "feature-payment",
    icon: "payment",
    title: "Payment Only Online",
    description: "We prepared special discounts you on grocery products.",
  },
  {
    id: "feature-stocks",
    icon: "stocks",
    title: "Everyday New Stocks",
    description: "We prepared special discounts you on grocery products.",
  },
  {
    id: "feature-quality",
    icon: "quality",
    title: "Best Quality Assurance",
    description: "We prepared special discounts you on grocery products.",
  },
  {
    id: "feature-delivery",
    icon: "delivery",
    title: "Delivery Within 30 Mins",
    description: "We prepared special discounts you on grocery products.",
  },
];

export const productCardLabels: ProductCardLabels = {
  saleTag: "ON SALE",
  addToCart: "Add To Cart",
};

const dealProduct = (id: string, image: string): Product => ({
  id,
  name: "Nestle Cerelac Mixed Fruits & Wheat with Milk",
  pack: "500g Pack",
  price: "$36.00",
  oldPrice: "$38.00",
  rating: 5,
  image,
});

export const dealsOfTheDay: { heading: string; products: Product[] } = {
  heading: "Deals Of The Day",
  products: [
    dealProduct("deal-1", img(photo.spicesSpread)),
    dealProduct("deal-2", img(photo.chipsBags)),
    dealProduct("deal-3", img(photo.burger)),
    dealProduct("deal-4", img(photo.watermelon)),
    dealProduct("deal-5", img(photo.smoothieBowl)),
  ],
};

export const weekendBanner: WeekendBannerContent = {
  label: "Weekend Discount",
  heading: "Healthy vegetable that you deserve to eat fresh",
  description:
    "We have prepared special discounts for you on grocery products. Don't miss these opportunities...",
  image: img(photo.groceryShelfVeg, 520, 280),
  imageAlt: "Assorted grocery products",
};

export const collections: CollectionsContent = {
  seeMore: "See More",
  sections: [
    {
      id: "recently-added",
      title: "Recently Added",
      products: [
        {
          id: "recent-1",
          name: "Gerber Superfood Hearts Puffed Multigrain Snack",
          pack: "500g Pack",
          price: "$36.00",
          oldPrice: "$38.00",
          rating: 5,
          image: img(photo.chipsBags),
        },
        {
          id: "recent-2",
          name: "John Soules Foods, Fully Cooked, Steak Fajitas",
          pack: "500g Pack",
          price: "$36.00",
          oldPrice: "$38.00",
          rating: 5,
          image: img(photo.burger),
        },
      ],
    },
    {
      id: "top-selling",
      title: "Top Selling",
      products: [
        dealProduct("selling-1", img(photo.watermelon)),
        dealProduct("selling-2", img(photo.smoothieBowl)),
      ],
    },
    {
      id: "top-rated",
      title: "Top Rated",
      products: [
        dealProduct("rated-1", img(photo.pancakesStack)),
        dealProduct("rated-2", img(photo.chipsBags)),
      ],
    },
    {
      id: "deals-day",
      title: "Deals of the day",
      products: [
        dealProduct("day-1", img(photo.pastaBowl)),
        dealProduct("day-2", img(photo.fruitPlatter)),
      ],
    },
  ],
};

export const gallery: GalleryContent = {
  heading: "From Our Gallery",
  images: [
    { id: "gallery-1", image: img(photo.groceryShelfVeg, 1200, 480), imageAlt: "Fresh vegetables on our shop shelves" },
    { id: "gallery-2", image: img(photo.vegSpreadDark, 1200, 480), imageAlt: "A spread of fresh, colorful vegetables" },
    { id: "gallery-3", image: img(photo.fruitPlatter, 1200, 480), imageAlt: "Mixed fresh fruit platter" },
    { id: "gallery-4", image: img(photo.breadLoaves, 1200, 480), imageAlt: "Rustic bread loaves" },
    { id: "gallery-5", image: img(photo.saladBowl, 1200, 480), imageAlt: "Big fresh vegetable salad bowl" },
  ],
};

export const footer: FooterContent = {
  tagline: "What's inside: New Arrivals, Exclusive Sales, News & Mores",
  emailPlaceholder: "Email Address",
  socials: [
    { id: "facebook", href: "#" },
    { id: "instagram", href: "#" },
  ],
  columns: [
    {
      title: "Shop Categories",
      links: [
        { label: "Contact Us", href: "/contact" },
        { label: "About Us", href: "/about" },
      ],
    },
  ],
  help: {
    title: "Need Help? / Contact Us",
    address: STORE_ADDRESS,
    hours: "Mon–Fri 7:30 AM – 10:30 PM, Sat–Sun 8:00 AM – 10:30 PM",
    whatsappNumber: "+65-8185-0452",
  },
  copyright: "Copyright 2024 ©Farm To Home, All rights reserved.",
};

export const map: MapContent = {
  heading: "Find Us",
  address: STORE_ADDRESS,
};
