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
  price: string;
  oldPrice?: string | null;
  rating?: number;
  image?: string | null;
  tag: string;
}

function fromSimpleProducts(items: home.SimpleProduct[], tag: string): SeedProduct[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    image: item.image,
    tag,
  }));
}

function fromProducts(items: home.Product[], tag: string): SeedProduct[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    pack: item.pack,
    price: item.price,
    oldPrice: item.oldPrice,
    rating: item.rating,
    image: item.image,
    tag,
  }));
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
        oldPrice: product.oldPrice ?? null,
        rating: product.rating ?? 5,
        image: product.image ?? null,
        featuredTags: Array.from(product.tags),
      },
      update: {
        name: product.name,
        pack: product.pack ?? null,
        price: product.price,
        oldPrice: product.oldPrice ?? null,
        rating: product.rating ?? 5,
        image: product.image ?? null,
        featuredTags: Array.from(product.tags),
      },
    });
    console.log(`  tagged product ${product.id} -> [${Array.from(product.tags).join(", ")}]`);
  }
}

async function main() {
  console.log("Seeding home page sections...");
  await seedSections(homeSections);
  console.log("Seeding about page sections...");
  await seedSections(aboutSections);
  console.log("Seeding + tagging placeholder products...");
  await seedProducts();
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
