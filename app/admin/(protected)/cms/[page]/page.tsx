import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSectionsForPage, pages } from "@/lib/cms/sections.config";
import SectionCard from "../SectionCard";

export function generateStaticParams() {
  return pages.map((p) => ({ page: p.page }));
}

export default async function CmsPageEditor({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const pageDef = pages.find((p) => p.page === page);
  if (!pageDef) notFound();

  const sectionDefs = getSectionsForPage(page);

  const [rows, tagCounts] = await Promise.all([
    prisma.pageSection.findMany({ where: { page } }),
    Promise.all(
      sectionDefs
        .filter((s) => s.productTag)
        .map(async (s) => ({
          tag: s.productTag!,
          count: await prisma.product.count({ where: { featuredTags: { has: s.productTag! } } }),
        }))
    ),
  ]);

  const rowsByKey = new Map(rows.map((row) => [row.sectionKey, row]));
  const countsByTag = new Map(tagCounts.map((t) => [t.tag, t.count]));

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">{pageDef.label}</h1>
      <p className="mt-1 text-sm text-gray-500">
        Sections shown in the same order they appear on the live page. Toggle a section off to
        hide it immediately; expand a section to edit its text and images.
      </p>

      <div className="mt-6 space-y-4">
        {sectionDefs.map((section) => {
          const row = rowsByKey.get(section.sectionKey);
          return (
            <SectionCard
              key={section.sectionKey}
              section={section}
              enabled={row?.enabled ?? true}
              content={(row?.content as Record<string, unknown>) ?? {}}
              productCount={section.productTag ? countsByTag.get(section.productTag) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
