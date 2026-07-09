// Per-product SEO text generation for the product detail page — kept
// separate from the page component so the phrasing logic is testable/
// reusable on its own. Real, legitimate on-page SEO groundwork (unique
// title/description per product, descriptive alt text, schema.org
// structured data) — none of this can promise any specific search ranking.

export function buildProductMetaTitle(name: string): string {
  return `${name} | Buy Online in Singapore | Farm To Home`;
}

// Deliberately phrased around real search intent ("buy X online Singapore",
// "X delivery") rather than reusing detailedDescription verbatim — that
// field is written for a human reading the page, this is written for a
// search snippet.
export function buildProductMetaDescription(name: string, categoryName: string | null): string {
  const categoryPhrase = categoryName ? ` Shop more ${categoryName.toLowerCase()} and other` : " Shop";
  return `Buy ${name} online in Singapore.${categoryPhrase} groceries from Farm To Home, with fast islandwide delivery.`;
}

export function buildProductAltText(name: string, categoryName: string | null): string {
  return categoryName ? `${name} — ${categoryName} | Farm To Home` : `${name} | Farm To Home`;
}

export interface ProductStructuredDataInput {
  name: string;
  description: string | null;
  imageUrl: string;
  price: number;
  inStock: boolean;
  url: string;
  categoryName: string | null;
}

// schema.org/Product — lets search engines show rich results (price,
// availability) for a product page. Not a ranking guarantee; it's the
// standard, legitimate markup search engines look for on commerce pages.
export function buildProductStructuredData(input: ProductStructuredDataInput) {
  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: input.name,
    image: [input.imageUrl],
    description: input.description ?? input.name,
    category: input.categoryName ?? undefined,
    offers: {
      "@type": "Offer",
      url: input.url,
      priceCurrency: "SGD",
      price: input.price.toFixed(2),
      availability: input.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
}
