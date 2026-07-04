// Migrates the current static content/homepage.ts + content/about.ts into
// PageSection rows, and tags the existing placeholder products so the
// product-linked homepage sections keep showing the same items. Run once
// via `pnpm db:seed`. Safe to re-run — every write is an upsert.
//
// Unlike `next dev`/`next build` (which load .env automatically) or
// prisma.config.ts (which imports dotenv/config itself), a plain `tsx`
// script does not load .env on its own — without this import,
// process.env.DATABASE_URL is undefined here and `pg` silently falls back
// to its default localhost:5432, producing an immediate ECONNREFUSED that
// looks like a real connection failure but isn't one.
import "dotenv/config";
import { Prisma, PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as home from "../content/homepage";
import * as about from "../content/about";
import { computeIsOnSale } from "../lib/pricing";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

interface SeedSection {
  page: string;
  sectionKey: string;
  label: string;
  sortOrder: number;
  enabled?: boolean;
  content: Record<string, unknown>;
}

// Prisma's InputJsonValue is a strict recursive union that trips up on
// plain TS interfaces/arrays (missing index signatures) even though the
// data is genuinely JSON-serializable at runtime — cast once here instead
// of fighting the type at every call site.
function toJson(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

const homeSections: SeedSection[] = [
  {
    page: "home",
    sectionKey: "hero",
    label: "Hero Banner",
    sortOrder: 1,
    content: { ...home.hero },
  },
  {
    page: "home",
    sectionKey: "category_strip",
    label: "Category Strip",
    sortOrder: 2,
    content: { categories: home.categories },
  },
  {
    page: "home",
    sectionKey: "promo_banners",
    label: "Promo Banners",
    sortOrder: 3,
    content: { banners: home.promoBanners },
  },
  {
    page: "home",
    sectionKey: "weekly_best_seller",
    label: "Weekly Best Seller Grocery",
    sortOrder: 4,
    content: { heading: home.weeklyBestSeller.heading },
  },
  {
    page: "home",
    sectionKey: "feature_band",
    label: "Feature Band",
    sortOrder: 5,
    content: { features: home.features },
  },
  {
    page: "home",
    sectionKey: "deals_of_the_day",
    label: "Deals Of The Day",
    sortOrder: 6,
    content: { heading: home.dealsOfTheDay.heading },
  },
  {
    page: "home",
    sectionKey: "weekend_banner",
    label: "Weekend Discount Banner",
    sortOrder: 7,
    content: { ...home.weekendBanner },
  },
  {
    page: "home",
    sectionKey: "recently_added",
    label: "Recently Added",
    sortOrder: 8,
    content: {
      heading: home.collections.sections[0].title,
      seeMoreLabel: home.collections.seeMore,
    },
  },
  {
    page: "home",
    sectionKey: "top_selling",
    label: "Top Selling",
    sortOrder: 9,
    content: {
      heading: home.collections.sections[1].title,
      seeMoreLabel: home.collections.seeMore,
    },
  },
  {
    page: "home",
    sectionKey: "top_rated",
    label: "Top Rated",
    sortOrder: 10,
    content: {
      heading: home.collections.sections[2].title,
      seeMoreLabel: home.collections.seeMore,
    },
  },
  {
    page: "home",
    sectionKey: "blog_insights",
    label: "Latest Blog Post Insights",
    sortOrder: 11,
    content: { heading: home.blog.heading, readMore: home.blog.readMore, posts: home.blog.posts },
  },
];

const aboutSections: SeedSection[] = [
  {
    page: "about",
    sectionKey: "hero",
    label: "Hero Banner",
    sortOrder: 1,
    content: {
      heading: about.aboutHero.heading,
      description: about.aboutHero.description,
      cta: about.aboutHero.cta,
      ctaHref: about.aboutHero.ctaHref,
      backgroundImage: about.aboutHero.backgroundImage,
      imageAlt: about.aboutHero.imageAlt,
    },
  },
  {
    page: "about",
    sectionKey: "stats_bar",
    label: "Stats Bar",
    sortOrder: 2,
    content: { stats: about.stats },
  },
  {
    page: "about",
    sectionKey: "destination",
    label: "Quality Produce Section",
    sortOrder: 3,
    content: { ...about.destination },
  },
  {
    page: "about",
    sectionKey: "team",
    label: "Meet Our Team",
    sortOrder: 4,
    enabled: about.team.show,
    content: {
      heading: about.team.heading,
      subtext: about.team.subtext,
      contactPhone: about.team.contactPhone,
      members: about.team.members,
    },
  },
  {
    page: "about",
    sectionKey: "why_choose_us",
    label: "Why You Choose Us?",
    sortOrder: 5,
    content: { ...about.whyChooseUs },
  },
  {
    page: "about",
    sectionKey: "testimonials",
    label: "Customer Feedbacks",
    sortOrder: 6,
    content: {
      heading: about.testimonials.heading,
      testimonials: about.testimonials.testimonials,
    },
  },
  {
    page: "about",
    sectionKey: "feature_band",
    label: "Feature Band",
    sortOrder: 7,
    content: { features: about.featureStrip },
  },
];

async function seedSections(rows: SeedSection[]) {
  for (const row of rows) {
    await prisma.pageSection.upsert({
      where: { page_sectionKey: { page: row.page, sectionKey: row.sectionKey } },
      create: {
        page: row.page,
        sectionKey: row.sectionKey,
        label: row.label,
        sortOrder: row.sortOrder,
        enabled: row.enabled ?? true,
        content: toJson(row.content),
      },
      update: {
        label: row.label,
        sortOrder: row.sortOrder,
        content: toJson(row.content),
      },
    });
    console.log(`  seeded ${row.page}/${row.sectionKey}`);
  }
}

interface SeedProduct {
  id: string;
  name: string;
  pack?: string | null;
  price: number;
  compareAtPrice?: number | null;
  discountActive?: boolean;
  isOnSale?: boolean;
  rating?: number;
  image?: string | null;
  tag: string;
}

// content/homepage.ts still stores placeholder prices as display strings
// like "$36.00" (that's a separate, unrelated static-content shape) — parse
// them into real numbers for the actual Product rows.
function parseMoney(value: string): number {
  return Number(value.replace(/[^0-9.]/g, ""));
}

function fromSimpleProducts(items: home.SimpleProduct[], tag: string): SeedProduct[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    price: parseMoney(item.price),
    image: item.image,
    tag,
  }));
}

function fromProducts(items: home.Product[], tag: string): SeedProduct[] {
  return items.map((item) => {
    const price = parseMoney(item.price);
    const compareAtPrice = item.oldPrice ? parseMoney(item.oldPrice) : null;
    const discountActive = compareAtPrice != null && compareAtPrice > price;
    return {
      id: item.id,
      name: item.name,
      pack: item.pack,
      price,
      compareAtPrice,
      discountActive,
      isOnSale: computeIsOnSale({ price, compareAtPrice, discountActive }),
      rating: item.rating,
      image: item.image,
      tag,
    };
  });
}

async function seedProducts() {
  const seedProducts: SeedProduct[] = [
    ...fromSimpleProducts(home.weeklyBestSeller.products, "weekly_best_seller"),
    ...fromProducts(home.dealsOfTheDay.products, "deals_of_the_day"),
    ...fromProducts(home.collections.sections[0].products, "recently_added"),
    ...fromProducts(home.collections.sections[1].products, "top_selling"),
    ...fromProducts(home.collections.sections[2].products, "top_rated"),
  ];

  // A placeholder id (e.g. "weekly-1") can appear more than once if it was
  // reused for multiple sections in the old static content — merge those
  // into a single product carrying every tag it was reused under.
  const byId = new Map<string, SeedProduct & { tags: Set<string> }>();
  for (const item of seedProducts) {
    const existing = byId.get(item.id);
    if (existing) {
      existing.tags.add(item.tag);
      continue;
    }
    byId.set(item.id, { ...item, tags: new Set([item.tag]) });
  }

  for (const product of byId.values()) {
    await prisma.product.upsert({
      where: { id: product.id },
      create: {
        id: product.id,
        name: product.name,
        pack: product.pack ?? null,
        price: product.price,
        compareAtPrice: product.compareAtPrice ?? null,
        discountActive: product.discountActive ?? false,
        isOnSale: product.isOnSale ?? false,
        rating: product.rating ?? 5,
        image: product.image ?? null,
        featuredTags: Array.from(product.tags),
      },
      update: {
        name: product.name,
        pack: product.pack ?? null,
        price: product.price,
        compareAtPrice: product.compareAtPrice ?? null,
        discountActive: product.discountActive ?? false,
        isOnSale: product.isOnSale ?? false,
        rating: product.rating ?? 5,
        image: product.image ?? null,
        featuredTags: Array.from(product.tags),
      },
    });
    console.log(`  tagged product ${product.id} -> [${Array.from(product.tags).join(", ")}]`);
  }
}

const shopSections: SeedSection[] = [
  {
    page: "shop",
    sectionKey: "hero",
    label: "Page Heading",
    sortOrder: 1,
    content: { breadcrumbLabel: "Shop", heading: "All Products" },
  },
];

const cartSections: SeedSection[] = [
  {
    page: "cart",
    sectionKey: "hero",
    label: "Page Heading",
    sortOrder: 1,
    content: { breadcrumbLabel: "Cart", heading: "Shopping Cart" },
  },
  {
    page: "cart",
    sectionKey: "feature_band",
    label: "Feature Band",
    sortOrder: 2,
    content: { features: home.features },
  },
];

const wishlistSections: SeedSection[] = [
  {
    page: "wishlist",
    sectionKey: "hero",
    label: "Page Heading",
    sortOrder: 1,
    content: { breadcrumbLabel: "Wishlist", heading: "My Wishlist" },
  },
  {
    page: "wishlist",
    sectionKey: "feature_band",
    label: "Feature Band",
    sortOrder: 2,
    content: { features: home.features },
  },
];

// Demo categories/brands + backfilling them onto the placeholder products
// above, so /shop's filters have real, testable data out of the box instead
// of starting completely empty (which would hide every filter section).
async function seedCatalogAndBackfill() {
  const categoryNames = [
    // Demo categories used to backfill the placeholder seed products below —
    // kept so /shop's filters still have this test data out of the box.
    "Fresh Meat",
    "Baby Food",
    "Frozen & Ready Meals",
    // Real category list provided by the client — added exactly as given,
    // none skipped. ("Liquor & Beer" and "Alcohol" look like they may
    // overlap — left as two separate categories per instruction; client can
    // merge later if they agree.)
    "Milk",
    "Grocery Dhall",
    "Yogurt",
    "Farm 2 Home Brand",
    "Egg",
    "Kitchen Spices",
    "Uncle Cook's Products",
    "Ponni Rice",
    "Indian Vegetables",
    "Malaysia Vegetables",
    "Fruits",
    "Ghee",
    "Oil",
    "Sugar",
    "Rice",
    "Flour",
    "Ready to Eat",
    "Frozen",
    "Salt",
    "Atta",
    "Noodles & Pastha Kitchen",
    "Honey",
    "Jam",
    "Peshwai's Items",
    "Snacks",
    "Essential",
    "Liquor & Beer",
    "Drinks",
    "Alcohol",
    "Tea & Coffee",
    "Rice Flaks",
    "Breakfast",
  ];
  const brandNames = ["Nestle", "Gerber", "John Soules Foods"];

  const categories = new Map<string, string>();
  for (const name of categoryNames) {
    const row = await prisma.category.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    categories.set(name, row.id);
  }

  const brands = new Map<string, string>();
  for (const name of brandNames) {
    const row = await prisma.brand.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    brands.set(name, row.id);
  }

  interface Backfill {
    ids: string[];
    categoryId?: string;
    brandId?: string;
    inStock?: boolean;
    discountActive?: boolean;
  }

  const backfills: Backfill[] = [
    { ids: ["weekly-1", "weekly-2", "weekly-3", "weekly-6"], categoryId: categories.get("Fresh Meat") },
    { ids: ["weekly-4", "weekly-5"], categoryId: categories.get("Fresh Meat"), inStock: false },
    {
      ids: ["deal-1", "deal-2", "deal-3", "deal-4", "deal-5", "selling-1", "selling-2", "rated-2"],
      categoryId: categories.get("Baby Food"),
      brandId: brands.get("Nestle"),
    },
    // Discount turned off despite still carrying a compareAtPrice — exercises
    // the "toggle off keeps the number but hides the badge" rule.
    {
      ids: ["rated-1"],
      categoryId: categories.get("Baby Food"),
      brandId: brands.get("Nestle"),
      discountActive: false,
    },
    { ids: ["recent-1"], categoryId: categories.get("Snacks"), brandId: brands.get("Gerber") },
    {
      ids: ["recent-2"],
      categoryId: categories.get("Frozen & Ready Meals"),
      brandId: brands.get("John Soules Foods"),
    },
  ];

  for (const backfill of backfills) {
    for (const id of backfill.ids) {
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) continue;

      const discountActive = backfill.discountActive ?? product.discountActive;
      const isOnSale = computeIsOnSale({
        price: product.price.toNumber(),
        compareAtPrice: product.compareAtPrice ? product.compareAtPrice.toNumber() : null,
        discountActive,
      });

      await prisma.product.update({
        where: { id },
        data: {
          categoryId: backfill.categoryId ?? product.categoryId,
          brandId: backfill.brandId ?? product.brandId,
          inStock: backfill.inStock ?? product.inStock,
          discountActive,
          isOnSale,
        },
      });
    }
    console.log(`  backfilled catalog data for [${backfill.ids.join(", ")}]`);
  }
}

// SiteSettings is a singleton — only ever create the one row if none exists
// yet; never overwrite an admin's saved values on re-seed.
async function seedSiteSettings() {
  const existing = await prisma.siteSettings.findFirst();
  if (existing) {
    console.log("  SiteSettings row already exists, leaving it as-is");
    return;
  }
  await prisma.siteSettings.create({ data: {} });
  console.log("  created default SiteSettings row");
}

// Demo coupons so the /cart verification flow has both a valid and a
// rejected code to test against. Upserted by code so re-seeding is safe.
async function seedCoupons() {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const coupons = [
    {
      code: "WELCOME10",
      discountType: "PERCENTAGE",
      discountValue: 10,
      active: true,
      startDate: null,
      endDate: null,
    },
    {
      code: "MONSOON10",
      discountType: "FIXED",
      discountValue: 10,
      active: true,
      startDate: null,
      endDate: yesterday, // expired — exercises the date-range rejection path
    },
  ];

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      create: coupon,
      update: coupon,
    });
    console.log(`  seeded coupon ${coupon.code}`);
  }
}

async function main() {
  console.log("Seeding home page sections...");
  await seedSections(homeSections);
  console.log("Seeding about page sections...");
  await seedSections(aboutSections);
  console.log("Seeding shop page sections...");
  await seedSections(shopSections);
  console.log("Seeding cart page sections...");
  await seedSections(cartSections);
  console.log("Seeding wishlist page sections...");
  await seedSections(wishlistSections);
  console.log("Seeding + tagging placeholder products...");
  await seedProducts();
  console.log("Seeding categories/brands + backfilling products...");
  await seedCatalogAndBackfill();
  console.log("Seeding site settings...");
  await seedSiteSettings();
  console.log("Seeding demo coupons...");
  await seedCoupons();
  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
