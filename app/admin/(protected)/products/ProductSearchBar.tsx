"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Debounced, server-side search: typing here never filters an
// already-loaded page client-side — it waits for a pause in typing, then
// navigates (via router.replace, no history spam) to a URL carrying `q`,
// which app/admin/(protected)/products/page.tsx reads and queries the
// database with directly. `page` is deliberately never carried over here so
// every new search always lands back on page 1.
const DEBOUNCE_MS = 400;

export default function ProductSearchBar({
  initialQuery,
  activeTag,
}: {
  initialQuery: string;
  activeTag?: string;
}) {
  const router = useRouter();
  // Not re-synced from `initialQuery` via effect: the parent page keys
  // ProductsClient on page/tag/query, so this whole component remounts
  // (fresh `useState(initialQuery)`) any time the URL's `q` changes from
  // outside this input — back/forward navigation, the "Clear filter" link,
  // etc. — rather than needing an effect to sync it back in.
  const [value, setValue] = useState(initialQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleChange(next: string) {
    setValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (activeTag) params.set("tag", activeTag);
      const trimmed = next.trim();
      if (trimmed) params.set("q", trimmed);
      const qs = params.toString();
      router.replace(qs ? `/admin/products?${qs}` : "/admin/products");
    }, DEBOUNCE_MS);
  }

  return (
    <div className="w-full max-w-sm">
      <label htmlFor="product-search" className="sr-only">
        Search products
      </label>
      <input
        id="product-search"
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search by name, category, or brand..."
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-dark-green focus:outline-none focus:ring-1 focus:ring-dark-green"
      />
    </div>
  );
}
