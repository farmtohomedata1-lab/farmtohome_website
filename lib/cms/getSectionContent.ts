import "server-only";
import { prisma } from "@/lib/prisma";

export interface ResolvedSection<T> {
  content: T;
}

/**
 * The one place that decides whether a section renders at all.
 *
 * Returns null (render nothing, no error, no gap) when: the row doesn't
 * exist yet, `enabled` is false, or the database call throws for any
 * reason. Every failure is caught and logged here so a problem with one
 * section's row can never take down the rest of the page.
 */
export async function getSectionContent<T = Record<string, unknown>>(
  page: string,
  sectionKey: string
): Promise<ResolvedSection<T> | null> {
  try {
    const row = await prisma.pageSection.findUnique({
      where: { page_sectionKey: { page, sectionKey } },
    });
    if (!row || !row.enabled) return null;
    return { content: row.content as T };
  } catch (err) {
    console.error(`[cms] getSectionContent(${page}, ${sectionKey}) failed:`, err);
    return null;
  }
}

export interface FeaturedProduct {
  id: string;
  name: string;
  pack: string | null;
  price: string;
  oldPrice: string | null;
  rating: number;
  image: string | null;
}

/**
 * Products for a tag-driven list section (weekly_best_seller,
 * deals_of_the_day, recently_added, top_selling, top_rated). Returns an
 * empty array — never throws — so the caller can render nothing when no
 * product currently carries the tag.
 */
export async function getFeaturedProducts(tag: string): Promise<FeaturedProduct[]> {
  try {
    const products = await prisma.product.findMany({
      where: { featuredTags: { has: tag } },
      orderBy: { createdAt: "asc" },
    });
    return products.map((product) => ({
      id: product.id,
      name: product.name,
      pack: product.pack,
      price: product.price,
      oldPrice: product.oldPrice,
      rating: product.rating,
      image: product.image,
    }));
  } catch (err) {
    console.error(`[cms] getFeaturedProducts(${tag}) failed:`, err);
    return [];
  }
}
