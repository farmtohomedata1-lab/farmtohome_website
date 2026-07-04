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
  | "deals";

export type SocialIconName =
  | "facebook"
  | "twitter"
  | "linkedin"
  | "youtube"
  | "instagram";

export interface NavLink {
  label: string;
  href: string;
}

export interface TopBarContent {
  welcome: string;
  links: NavLink[];
}

export interface HeaderContent {
  logoPrefix: string;
  logoSuffix: string;
  categoriesLabel: string;
  searchPlaceholder: string;
  searchButton: string;
  wishlist: string;
  cart: string;
}

export interface NavBarContent {
  links: NavLink[];
  delivery: string;
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
}

export interface Category {
  id: string;
  name: string;
  items: string;
  image: string;
}

export interface PromoBanner {
  id: string;
  headingLine1: string;
  headingLine2: string;
  priceLabel: string;
  price: string;
  image: string;
  imageAlt: string;
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

export interface BlogPost {
  id: string;
  image: string;
  imageAlt: string;
  date: string;
  category: string;
  title: string;
}

export interface BlogContent {
  heading: string;
  readMore: string;
  posts: BlogPost[];
}

export interface FooterColumn {
  title: string;
  links: NavLink[];
}

export interface FooterContent {
  logoPrefix: string;
  logoSuffix: string;
  tagline: string;
  emailPlaceholder: string;
  socials: { id: SocialIconName; href: string }[];
  columns: FooterColumn[];
  help: {
    title: string;
    address: string;
    hours: string;
    phone: string;
    chatTitle: string;
    chatSubtitle: string;
  };
  copyright: string;
  paymentLabel: string;
  payments: string[];
}

export const topBar: TopBarContent = {
  welcome: "Welcome to our Organic store EkoMart!",
  links: [
    { label: "Track Order", href: "#" },
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "FAQ", href: "#" },
  ],
};

export const header: HeaderContent = {
  logoPrefix: "EKO",
  logoSuffix: "MART",
  categoriesLabel: "Categories",
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
  ],
  delivery: "Delivery: 258 FKD Street, Berlin",
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

export const promoBanners: PromoBanner[] = [
  {
    id: "promo-1",
    headingLine1: "Get Everyday Fresh",
    headingLine2: "Organic Vegetable",
    priceLabel: "Only",
    price: "$15.00",
    image: img(photo.onionsPile, 200, 160),
    imageAlt: "Fresh onions",
  },
  {
    id: "promo-2",
    headingLine1: "Get Everyday Fresh",
    headingLine2: "Organic Vegetable",
    priceLabel: "Only",
    price: "$15.00",
    image: img(photo.candyBars, 200, 160),
    imageAlt: "Grocery packs",
  },
];

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

export const blog: BlogContent = {
  heading: "Latest Blog Post Insights",
  readMore: "Read Details",
  posts: [
    {
      id: "blog-1",
      image: img(photo.bibimbap, 600, 400),
      imageAlt: "Colorful seasoned rice bowl with vegetables",
      date: "15 Sep, 2023",
      category: "Modern Fashion",
      title: "Fashion Fixation: Fueling Your Passion for All Things Stylish",
    },
    {
      id: "blog-2",
      image: img(photo.saladBowl, 600, 400),
      imageAlt: "Fresh vegetable salad bowl",
      date: "15 Sep, 2023",
      category: "Modern Fashion",
      title: "Fashion Fixation: Fueling Your Passion for All Things Stylish",
    },
    {
      id: "blog-3",
      image: img(photo.potatoes, 600, 400),
      imageAlt: "Freshly harvested potatoes",
      date: "15 Sep, 2023",
      category: "Modern Fashion",
      title: "Fashion Fixation: Fueling Your Passion for All Things Stylish",
    },
  ],
};

export const footer: FooterContent = {
  logoPrefix: "EKO",
  logoSuffix: "MART",
  tagline: "What's inside: New Arrivals, Exclusive Sales, News & Mores",
  emailPlaceholder: "Email Address",
  socials: [
    { id: "facebook", href: "#" },
    { id: "twitter", href: "#" },
    { id: "linkedin", href: "#" },
    { id: "youtube", href: "#" },
    { id: "instagram", href: "#" },
  ],
  columns: [
    {
      title: "Our Stores",
      links: [
        { label: "Delivery Information", href: "#" },
        { label: "Privacy Policy", href: "#" },
        { label: "Terms & Conditions", href: "#" },
        { label: "Support Center", href: "#" },
        { label: "Careers", href: "#" },
      ],
    },
    {
      title: "Shop Categories",
      links: [
        { label: "Contact Us", href: "/contact" },
        { label: "Information", href: "#" },
        { label: "About Us", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Next Stories", href: "#" },
      ],
    },
  ],
  help: {
    title: "Need Help? / Contact Us",
    address: "258 Daniel Street, 2589 Phones Line Berlin, Germany",
    hours: "Call us between 8:00 AM – 12PM",
    phone: "+25896 3158 3228",
    chatTitle: "Live Chat",
    chatSubtitle: "Chat With an Experts",
  },
  copyright: "Copyright 2024 ©Ekomart, All rights reserved.",
  paymentLabel: "Payment Accepts:",
  payments: ["Skrill", "VISA", "MC", "PayPal", "AMEX"],
};
