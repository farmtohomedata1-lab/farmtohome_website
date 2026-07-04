"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SORT_LABELS, SORT_OPTIONS, type SortOption } from "@/lib/shop/constants";

export default function ShopToolbar({
  totalCount,
  page,
  pageSize,
  sort,
  searchTerm,
}: {
  totalCount: number;
  page: number;
  pageSize: number;
  sort: SortOption;
  searchTerm: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  function handleSortChange(nextSort: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextSort === "latest") params.delete("sort");
    else params.set("sort", nextSort);
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-gray-500">
        {totalCount === 0
          ? "No results found"
          : `Showing ${rangeStart}-${rangeEnd} of ${totalCount} results`}
        {searchTerm && (
          <>
            {" "}
            for <span className="font-semibold text-gray-700">&ldquo;{searchTerm}&rdquo;</span>
          </>
        )}
      </p>
      <div className="flex items-center gap-3">
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-dark-green focus:outline-none focus:ring-1 focus:ring-dark-green"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {SORT_LABELS[option]}
            </option>
          ))}
        </select>
        <Link
          href="/shop"
          className="whitespace-nowrap rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Reset Filters
        </Link>
      </div>
    </div>
  );
}
