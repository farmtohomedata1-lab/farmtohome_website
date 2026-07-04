import Link from "next/link";
import type { ShopSearchParams } from "@/lib/shop/query";

function getPageWindow(current: number, total: number): (number | "...")[] {
  const delta = 2;
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  const window: (number | "...")[] = [1];
  if (left > 2) window.push("...");
  for (let i = left; i <= right; i++) window.push(i);
  if (right < total - 1) window.push("...");
  if (total > 1) window.push(total);
  return window;
}

export default function Pagination({
  currentPage,
  totalPages,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  searchParams: ShopSearchParams;
}) {
  if (totalPages <= 1) return null;

  function hrefForPage(page: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page") continue;
      if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
      else if (value != null) params.set(key, value);
    }
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `/shop?${qs}` : "/shop";
  }

  const pages = getPageWindow(currentPage, totalPages);

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-1.5" aria-label="Pagination">
      <Link
        href={hrefForPage(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage === 1}
        className={`rounded-md border border-gray-300 px-3 py-2 text-sm font-medium ${
          currentPage === 1 ? "pointer-events-none opacity-40" : "text-gray-700 hover:bg-gray-50"
        }`}
      >
        Prev
      </Link>
      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm text-gray-400">
            …
          </span>
        ) : (
          <Link
            key={page}
            href={hrefForPage(page)}
            className={`rounded-md border px-3 py-2 text-sm font-medium ${
              page === currentPage
                ? "border-brand-green bg-brand-green text-white"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {page}
          </Link>
        )
      )}
      <Link
        href={hrefForPage(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage === totalPages}
        className={`rounded-md border border-gray-300 px-3 py-2 text-sm font-medium ${
          currentPage === totalPages
            ? "pointer-events-none opacity-40"
            : "text-gray-700 hover:bg-gray-50"
        }`}
      >
        Next
      </Link>
    </nav>
  );
}
