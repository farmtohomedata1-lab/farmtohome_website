"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PriceRangeSlider from "./PriceRangeSlider";

const VISIBLE_COUNT = 5;

export interface NamedOption {
  id: string;
  name: string;
}

export default function ShopSidebar({
  categories,
  brands,
  priceMin,
  priceMax,
  selectedCategoryIds,
  selectedBrandIds,
  minPrice,
  maxPrice,
  inStockOnly,
  onSaleOnly,
}: {
  categories: NamedOption[];
  brands: NamedOption[];
  priceMin: number;
  priceMax: number;
  selectedCategoryIds: string[];
  selectedBrandIds: string[];
  minPrice: number | null;
  maxPrice: number | null;
  inStockOnly: boolean;
  onSaleOnly: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function toggleMulti(key: "category" | "brand", value: string, checked: boolean) {
    navigate((params) => {
      const current = params.getAll(key).filter((v) => v !== value);
      const next = checked ? [...current, value] : current;
      params.delete(key);
      next.forEach((v) => params.append(key, v));
    });
  }

  function toggleStatus(value: "in-stock" | "on-sale", checked: boolean) {
    navigate((params) => {
      const current = params.getAll("status").filter((v) => v !== value);
      const next = checked ? [...current, value] : current;
      params.delete("status");
      next.forEach((v) => params.append("status", v));
    });
  }

  function commitPriceRange([nextMin, nextMax]: [number, number]) {
    navigate((params) => {
      if (nextMin <= priceMin) params.delete("minPrice");
      else params.set("minPrice", String(nextMin));
      if (nextMax >= priceMax) params.delete("maxPrice");
      else params.set("maxPrice", String(nextMax));
    });
  }

  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-5">
        <FilterSection title="Price">
          <PriceRangeSlider
            min={priceMin}
            max={priceMax}
            value={[minPrice ?? priceMin, maxPrice ?? priceMax]}
            onCommit={commitPriceRange}
          />
        </FilterSection>

        {categories.length > 0 && (
          <FilterSection title="Product Categories">
            <ExpandableCheckboxList
              items={categories}
              selectedIds={selectedCategoryIds}
              onToggle={(id, checked) => toggleMulti("category", id, checked)}
            />
          </FilterSection>
        )}

        <FilterSection title="Product Status">
          <CheckboxRow
            label="In Stock"
            checked={inStockOnly}
            onChange={(checked) => toggleStatus("in-stock", checked)}
          />
          <CheckboxRow
            label="On Sale"
            checked={onSaleOnly}
            onChange={(checked) => toggleStatus("on-sale", checked)}
          />
        </FilterSection>

        {brands.length > 0 && (
          <FilterSection title="Brands">
            <ExpandableCheckboxList
              items={brands}
              selectedIds={selectedBrandIds}
              onToggle={(id, checked) => toggleMulti("brand", id, checked)}
            />
          </FilterSection>
        )}
      </div>
    </aside>
  );
}

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-dark-green">
        {title}
      </h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function ExpandableCheckboxList({
  items,
  selectedIds,
  onToggle,
}: {
  items: NamedOption[];
  selectedIds: string[];
  onToggle: (id: string, checked: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? items : items.slice(0, VISIBLE_COUNT);
  const hiddenCount = items.length - VISIBLE_COUNT;

  return (
    <>
      {visibleItems.map((item) => (
        <CheckboxRow
          key={item.id}
          label={item.name}
          checked={selectedIds.includes(item.id)}
          onChange={(checked) => onToggle(item.id, checked)}
        />
      ))}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="pt-1 text-xs font-semibold text-brand-green hover:underline"
        >
          {expanded ? "See less" : `See more (${hiddenCount})`}
        </button>
      )}
    </>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 text-sm text-gray-600">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
      />
      {label}
    </label>
  );
}
