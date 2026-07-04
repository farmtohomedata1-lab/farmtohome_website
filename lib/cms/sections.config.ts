// Single source of truth for what admin-editable fields exist on every page
// section, across every page. Drives the generic admin form renderer
// (components/admin/SectionForm.tsx) and documents each section's content
// shape. Adding a field here = it becomes editable in /admin/cms; no other
// admin UI code needs to change.
//
// Actual copy/values live in the database (seeded once from content/*.ts —
// see prisma/seed.ts) — this file only describes the shape of the form.

export type FieldType = "text" | "textarea" | "image" | "select" | "stringList";

export interface SelectOption {
  value: string;
  label: string;
}

export interface ScalarFieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: SelectOption[]; // required when type === "select"
}

export interface ObjectListFieldDef {
  key: string;
  label: string;
  type: "objectList";
  itemLabel: string; // e.g. "Category" — used for "+ Add Category"
  itemFields: ScalarFieldDef[];
}

export type FieldDef = ScalarFieldDef | ObjectListFieldDef;

export interface PageDef {
  page: string;
  label: string;
}

export interface SectionDef {
  page: string;
  sectionKey: string;
  label: string;
  sortOrder: number;
  /** Present only for sections whose product list comes from Product.featuredTags. */
  productTag?: string;
  fields: FieldDef[];
}

// Sidebar page tabs. Adding a future page = adding one entry here.
export const pages: PageDef[] = [
  { page: "home", label: "Home Page" },
  { page: "about", label: "About Us Page" },
  { page: "shop", label: "Shop Page" },
  { page: "cart", label: "Cart Page" },
  { page: "wishlist", label: "Wishlist Page" },
];

const featureIconOptions: SelectOption[] = [
  { value: "payment", label: "Payment / Credit Card" },
  { value: "stocks", label: "Stocks / Package" },
  { value: "quality", label: "Quality / Award" },
  { value: "delivery", label: "Delivery / Truck" },
  { value: "price", label: "Price / Tag" },
  { value: "returns", label: "Returns / Refresh" },
  { value: "support", label: "Support / Chat" },
  { value: "deals", label: "Deals / Percent" },
];

const whyChooseIconOptions: SelectOption[] = [
  { value: "organic", label: "Organic / Leaf" },
  { value: "delivery", label: "Delivery / Truck" },
  { value: "trust", label: "Trust / Shield" },
];

const featureListField: ObjectListFieldDef = {
  key: "features",
  label: "Feature Items",
  type: "objectList",
  itemLabel: "Feature",
  itemFields: [
    { key: "icon", label: "Icon", type: "select", options: featureIconOptions },
    { key: "title", label: "Title", type: "text" },
    { key: "description", label: "Description", type: "textarea" },
  ],
};

export const sections: SectionDef[] = [
  // ---------- Home ----------
  {
    page: "home",
    sectionKey: "hero",
    label: "Hero Banner",
    sortOrder: 1,
    fields: [
      { key: "eyebrow", label: "Eyebrow Text", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "cta", label: "Button Label", type: "text" },
      { key: "priceLabel", label: "Price Label", type: "text" },
      { key: "price", label: "Price", type: "text" },
      { key: "image", label: "Hero Image", type: "image" },
      { key: "imageAlt", label: "Image Alt Text", type: "text" },
    ],
  },
  {
    page: "home",
    sectionKey: "category_strip",
    label: "Category Strip",
    sortOrder: 2,
    fields: [
      {
        key: "categories",
        label: "Categories",
        type: "objectList",
        itemLabel: "Category",
        itemFields: [
          { key: "name", label: "Name", type: "text" },
          { key: "items", label: "Item Count Label", type: "text" },
          { key: "image", label: "Image", type: "image" },
        ],
      },
    ],
  },
  {
    page: "home",
    sectionKey: "promo_banners",
    label: "Promo Banners",
    sortOrder: 3,
    fields: [
      {
        key: "banners",
        label: "Banners",
        type: "objectList",
        itemLabel: "Banner",
        itemFields: [
          { key: "headingLine1", label: "Heading Line 1", type: "text" },
          { key: "headingLine2", label: "Heading Line 2", type: "text" },
          { key: "priceLabel", label: "Price Label", type: "text" },
          { key: "price", label: "Price", type: "text" },
          { key: "image", label: "Image", type: "image" },
          { key: "imageAlt", label: "Image Alt Text", type: "text" },
        ],
      },
    ],
  },
  {
    page: "home",
    sectionKey: "weekly_best_seller",
    label: "Weekly Best Seller Grocery",
    sortOrder: 4,
    productTag: "weekly_best_seller",
    fields: [{ key: "heading", label: "Section Heading", type: "text" }],
  },
  {
    page: "home",
    sectionKey: "feature_band",
    label: "Feature Band",
    sortOrder: 5,
    fields: [featureListField],
  },
  {
    page: "home",
    sectionKey: "deals_of_the_day",
    label: "Deals Of The Day",
    sortOrder: 6,
    productTag: "deals_of_the_day",
    fields: [{ key: "heading", label: "Section Heading", type: "text" }],
  },
  {
    page: "home",
    sectionKey: "weekend_banner",
    label: "Weekend Discount Banner",
    sortOrder: 7,
    fields: [
      { key: "label", label: "Label", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "image", label: "Image", type: "image" },
      { key: "imageAlt", label: "Image Alt Text", type: "text" },
    ],
  },
  {
    page: "home",
    sectionKey: "recently_added",
    label: "Recently Added",
    sortOrder: 8,
    productTag: "recently_added",
    fields: [
      { key: "heading", label: "Section Heading", type: "text" },
      { key: "seeMoreLabel", label: "“See More” Button Label", type: "text" },
    ],
  },
  {
    page: "home",
    sectionKey: "top_selling",
    label: "Top Selling",
    sortOrder: 9,
    productTag: "top_selling",
    fields: [
      { key: "heading", label: "Section Heading", type: "text" },
      { key: "seeMoreLabel", label: "“See More” Button Label", type: "text" },
    ],
  },
  {
    page: "home",
    sectionKey: "top_rated",
    label: "Top Rated",
    sortOrder: 10,
    productTag: "top_rated",
    fields: [
      { key: "heading", label: "Section Heading", type: "text" },
      { key: "seeMoreLabel", label: "“See More” Button Label", type: "text" },
    ],
  },
  {
    page: "home",
    sectionKey: "blog_insights",
    label: "Latest Blog Post Insights",
    sortOrder: 11,
    fields: [
      { key: "heading", label: "Section Heading", type: "text" },
      { key: "readMore", label: "“Read More” Label", type: "text" },
      {
        key: "posts",
        label: "Blog Posts",
        type: "objectList",
        itemLabel: "Post",
        itemFields: [
          { key: "image", label: "Image", type: "image" },
          { key: "imageAlt", label: "Image Alt Text", type: "text" },
          { key: "date", label: "Date", type: "text" },
          { key: "category", label: "Category Tag", type: "text" },
          { key: "title", label: "Title", type: "text" },
        ],
      },
    ],
  },

  // ---------- About ----------
  {
    page: "about",
    sectionKey: "hero",
    label: "Hero Banner",
    sortOrder: 1,
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "cta", label: "Button Label", type: "text" },
      { key: "ctaHref", label: "Button Link", type: "text" },
      { key: "backgroundImage", label: "Background Image", type: "image" },
      { key: "imageAlt", label: "Image Alt Text", type: "text" },
    ],
  },
  {
    page: "about",
    sectionKey: "stats_bar",
    label: "Stats Bar",
    sortOrder: 2,
    fields: [
      {
        key: "stats",
        label: "Stats",
        type: "objectList",
        itemLabel: "Stat",
        itemFields: [
          { key: "value", label: "Value", type: "text" },
          { key: "label", label: "Label", type: "text" },
        ],
      },
    ],
  },
  {
    page: "about",
    sectionKey: "destination",
    label: "Quality Produce Section",
    sortOrder: 3,
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "image", label: "Image", type: "image" },
      { key: "imageAlt", label: "Image Alt Text", type: "text" },
      { key: "bullets", label: "Bullet Points (one per line)", type: "stringList" },
    ],
  },
  {
    page: "about",
    sectionKey: "team",
    label: "Meet Our Team",
    sortOrder: 4,
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "subtext", label: "Subtext", type: "textarea" },
      { key: "contactPhone", label: "Contact Phone (shown on every card)", type: "text" },
      {
        key: "members",
        label: "Team Members",
        type: "objectList",
        itemLabel: "Team Member",
        itemFields: [
          { key: "photo", label: "Photo", type: "image" },
          { key: "imageAlt", label: "Image Alt Text", type: "text" },
          { key: "name", label: "Name", type: "text" },
          { key: "role", label: "Role", type: "text" },
        ],
      },
    ],
  },
  {
    page: "about",
    sectionKey: "why_choose_us",
    label: "Why You Choose Us?",
    sortOrder: 5,
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "subtext", label: "Subtext", type: "textarea" },
      {
        key: "cards",
        label: "Cards",
        type: "objectList",
        itemLabel: "Card",
        itemFields: [
          { key: "number", label: "Number (e.g. 01)", type: "text" },
          { key: "icon", label: "Icon", type: "select", options: whyChooseIconOptions },
          { key: "title", label: "Title", type: "text" },
          { key: "description", label: "Description", type: "textarea" },
        ],
      },
    ],
  },
  {
    page: "about",
    sectionKey: "testimonials",
    label: "Customer Feedbacks",
    sortOrder: 6,
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      {
        key: "testimonials",
        label: "Testimonials",
        type: "objectList",
        itemLabel: "Testimonial",
        itemFields: [
          { key: "avatar", label: "Avatar", type: "image" },
          { key: "imageAlt", label: "Image Alt Text", type: "text" },
          { key: "name", label: "Name", type: "text" },
          { key: "role", label: "Role", type: "text" },
          { key: "quote", label: "Quote", type: "textarea" },
        ],
      },
    ],
  },
  {
    page: "about",
    sectionKey: "feature_band",
    label: "Feature Band",
    sortOrder: 7,
    fields: [featureListField],
  },

  // ---------- Shop ----------
  {
    page: "shop",
    sectionKey: "hero",
    label: "Page Heading",
    sortOrder: 1,
    fields: [
      { key: "breadcrumbLabel", label: "Breadcrumb Label", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
    ],
  },

  // ---------- Cart ----------
  {
    page: "cart",
    sectionKey: "hero",
    label: "Page Heading",
    sortOrder: 1,
    fields: [
      { key: "breadcrumbLabel", label: "Breadcrumb Label", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
    ],
  },
  {
    page: "cart",
    sectionKey: "feature_band",
    label: "Feature Band",
    sortOrder: 2,
    fields: [featureListField],
  },

  // ---------- Wishlist ----------
  {
    page: "wishlist",
    sectionKey: "hero",
    label: "Page Heading",
    sortOrder: 1,
    fields: [
      { key: "breadcrumbLabel", label: "Breadcrumb Label", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
    ],
  },
  {
    page: "wishlist",
    sectionKey: "feature_band",
    label: "Feature Band",
    sortOrder: 2,
    fields: [featureListField],
  },
];

export function getSectionsForPage(page: string): SectionDef[] {
  return sections
    .filter((section) => section.page === page)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getSectionDef(page: string, sectionKey: string): SectionDef | undefined {
  return sections.find((s) => s.page === page && s.sectionKey === sectionKey);
}

export const productTags: SelectOption[] = sections
  .filter((s) => s.productTag)
  .map((s) => ({ value: s.productTag!, label: s.label }));
