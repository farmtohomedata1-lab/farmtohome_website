"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import type { SelectOption } from "@/lib/cms/sections.config";
import { formatPrice } from "@/lib/format";
import { computeDiscountPercent, computeIsOnSale } from "@/lib/pricing";
import NumberInput from "@/components/admin/NumberInput";
import TextInput from "@/components/admin/TextInput";
import TextareaField from "@/components/admin/TextareaField";
import ToggleField from "@/components/admin/ToggleField";
import ImageUploadField from "../cms/ImageUploadField";
import ProductSearchBar from "./ProductSearchBar";
import {
  createProduct,
  deleteProduct,
  toggleProductTag,
  updateProduct,
  type ProductFormValues,
} from "./actions";

export interface AdminProduct {
  id: string;
  name: string;
  pack: string;
  price: number;
  compareAtPrice: number | null;
  discountActive: boolean;
  inStock: boolean;
  rating: number;
  image: string;
  featuredTags: string[];
  categoryId: string;
  brandId: string;
  detailedDescription: string;
  chargeShipping: boolean;
  taxable: boolean;
  taxOverridePercent: number | null;
  isBundle: boolean;
}

export interface NamedOption {
  id: string;
  name: string;
}

const blankForm: ProductFormValues = {
  name: "",
  pack: "",
  price: 0,
  compareAtPrice: null,
  discountActive: false,
  inStock: true,
  rating: 5,
  image: "",
  categoryId: "",
  brandId: "",
  detailedDescription: "",
  chargeShipping: true,
  taxable: true,
  taxOverridePercent: null,
  isBundle: false,
};

export default function ProductsClient({
  initialProducts,
  availableTags,
  activeTag,
  initialQuery,
  bundleOnly,
  categories,
  brands,
  currentPage,
  totalPages,
}: {
  initialProducts: AdminProduct[];
  availableTags: SelectOption[];
  activeTag?: string;
  initialQuery: string;
  bundleOnly: boolean;
  categories: NamedOption[];
  brands: NamedOption[];
  currentPage: number;
  totalPages: number;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [showAddForm, setShowAddForm] = useState(false);

  const activeTagLabel = availableTags.find((t) => t.value === activeTag)?.label;

  function pageHref(page: number): string {
    const params = new URLSearchParams();
    if (activeTag) params.set("tag", activeTag);
    if (initialQuery) params.set("q", initialQuery);
    if (bundleOnly) params.set("bundle", "1");
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `/admin/products?${qs}` : "/admin/products";
  }

  function clearTagHref(): string {
    const params = new URLSearchParams();
    if (initialQuery) params.set("q", initialQuery);
    if (bundleOnly) params.set("bundle", "1");
    const qs = params.toString();
    return qs ? `/admin/products?${qs}` : "/admin/products";
  }

  function bundleToggleHref(): string {
    const params = new URLSearchParams();
    if (activeTag) params.set("tag", activeTag);
    if (initialQuery) params.set("q", initialQuery);
    if (!bundleOnly) params.set("bundle", "1");
    const qs = params.toString();
    return qs ? `/admin/products?${qs}` : "/admin/products";
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <ProductSearchBar initialQuery={initialQuery} activeTag={activeTag} />
        <Link
          href={bundleToggleHref()}
          aria-pressed={bundleOnly}
          className={`shrink-0 rounded-md border px-3 py-2 text-sm font-medium ${
            bundleOnly
              ? "border-brand-green bg-brand-green/10 text-dark-green"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {bundleOnly ? "✓ Bundles only" : "Bundles only"}
        </Link>
      </div>

      {activeTag && (
        <div className="mb-4 mt-4 flex items-center justify-between rounded-md bg-brand-green/10 px-4 py-2.5 text-sm text-dark-green">
          <span>
            Showing products tagged <strong>{activeTagLabel ?? activeTag}</strong>
          </span>
          <Link href={clearTagHref()} className="font-semibold underline">
            Clear filter
          </Link>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowAddForm((v) => !v)}
        className="mt-4 rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white"
      >
        {showAddForm ? "Cancel" : "+ Add Product"}
      </button>

      {showAddForm && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-5">
          <ProductForm
            initialValues={blankForm}
            categories={categories}
            brands={brands}
            submitLabel="Add Product"
            onSubmit={async (values) => {
              const result = await createProduct(values);
              if (!result.error) setShowAddForm(false);
              return result;
            }}
            onCreated={(newProduct) => setProducts((prev) => [newProduct, ...prev])}
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {products.length === 0 && (
          <p className="rounded-md border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
            No {bundleOnly ? "bundle " : ""}products{activeTag ? " with this tag" : ""}
            {initialQuery ? ` matching "${initialQuery}"` : ""}.
          </p>
        )}
        {products.map((product) => (
          <ProductRow
            key={product.id}
            product={product}
            availableTags={availableTags}
            categories={categories}
            brands={brands}
            onUpdated={(updated) =>
              setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
            }
            onDeleted={(id) => setProducts((prev) => prev.filter((p) => p.id !== id))}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-1.5" aria-label="Pagination">
          <Link
            href={pageHref(Math.max(1, currentPage - 1))}
            aria-disabled={currentPage === 1}
            className={`rounded-md border border-gray-300 px-3 py-2 text-sm font-medium ${
              currentPage === 1 ? "pointer-events-none opacity-40" : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            Prev
          </Link>
          <span className="px-3 text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          <Link
            href={pageHref(Math.min(totalPages, currentPage + 1))}
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
      )}
    </div>
  );
}

function ProductRow({
  product,
  availableTags,
  categories,
  brands,
  onUpdated,
  onDeleted,
}: {
  product: AdminProduct;
  availableTags: SelectOption[];
  categories: NamedOption[];
  brands: NamedOption[];
  onUpdated: (product: AdminProduct) => void;
  onDeleted: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [tags, setTags] = useState(product.featuredTags);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);

  function handleToggleTag(tag: string, checked: boolean) {
    const previous = tags;
    const next = checked ? [...tags, tag] : tags.filter((t) => t !== tag);
    setTags(next);
    setTagError(null);
    startTransition(async () => {
      // Previously a failure here reverted the checkbox with no visible
      // message — indistinguishable, from the admin's side, from the click
      // "doing nothing." Surface it the same way handleDelete already does.
      const result = await toggleProductTag(product.id, tag, checked);
      if (result.error) {
        setTags(previous);
        setTagError(result.error);
      }
    });
  }

  function handleDelete() {
    if (!window.confirm(`Delete "${product.name}"? This can't be undone.`)) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteProduct(product.id);
      if (result.error) {
        setDeleteError(result.error);
      } else {
        onDeleted(product.id);
      }
    });
  }

  if (isEditing) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <ProductForm
          initialValues={{
            name: product.name,
            pack: product.pack,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            discountActive: product.discountActive,
            inStock: product.inStock,
            rating: product.rating,
            image: product.image,
            categoryId: product.categoryId,
            brandId: product.brandId,
            detailedDescription: product.detailedDescription,
            chargeShipping: product.chargeShipping,
            taxable: product.taxable,
            taxOverridePercent: product.taxOverridePercent,
            isBundle: product.isBundle,
          }}
          categories={categories}
          brands={brands}
          submitLabel="Save"
          onSubmit={(values) => updateProduct(product.id, values)}
          onCreated={() => {}}
          onSaved={(values) => {
            onUpdated({ ...product, ...values });
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  const isOnSale = computeIsOnSale(product);
  const categoryName = categories.find((c) => c.id === product.categoryId)?.name;
  const brandName = brands.find((b) => b.id === product.brandId)?.name;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
      {product.image ? (
        <Image
          src={product.image}
          alt={product.name}
          width={56}
          height={56}
          className="h-14 w-14 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-gray-100 text-[10px] text-gray-400">
          No image
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">
          {product.name}
          {product.isBundle && (
            <span className="ml-1.5 rounded-sm bg-gold/20 px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase text-dark-green">
              Bundle
            </span>
          )}
        </p>
        <p className="text-xs text-gray-500">
          {product.pack && `${product.pack} · `}
          {formatPrice(product.price)}
          {product.compareAtPrice != null && (
            <span className="ml-1 line-through">{formatPrice(product.compareAtPrice)}</span>
          )}
          {isOnSale && product.compareAtPrice != null && (
            <span className="ml-1 font-semibold text-sale-red">
              {computeDiscountPercent(product.price, product.compareAtPrice)}% off
            </span>
          )}
          {!product.inStock && <span className="ml-1 font-semibold text-gray-400">Out of stock</span>}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">
          {categoryName ?? "No category"} · {brandName ?? "No brand"}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {availableTags.map((tagOption) => (
          <label key={tagOption.value} className="flex items-center gap-1.5 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={tags.includes(tagOption.value)}
              disabled={isPending}
              onChange={(e) => handleToggleTag(tagOption.value, e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-brand-green focus:ring-brand-green"
            />
            {tagOption.label}
          </label>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
        >
          Delete
        </button>
      </div>
      {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
      {tagError && <p className="text-xs text-red-600">{tagError}</p>}
    </div>
  );
}

function ProductForm({
  initialValues,
  categories,
  brands,
  submitLabel,
  onSubmit,
  onCreated,
  onSaved,
  onCancel,
}: {
  initialValues: ProductFormValues;
  categories: NamedOption[];
  brands: NamedOption[];
  submitLabel: string;
  onSubmit: (values: ProductFormValues) => Promise<{ error?: string }>;
  onCreated: (product: AdminProduct) => void;
  onSaved?: (values: ProductFormValues) => void;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState(initialValues);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await onSubmit(values);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (onSaved) {
        onSaved(values);
      } else {
        onCreated({
          id: crypto.randomUUID(),
          name: values.name,
          pack: values.pack,
          price: values.price,
          compareAtPrice: values.compareAtPrice,
          discountActive: values.discountActive,
          inStock: values.inStock,
          rating: values.rating,
          image: values.image,
          featuredTags: [],
          categoryId: values.categoryId,
          brandId: values.brandId,
          detailedDescription: values.detailedDescription,
          chargeShipping: values.chargeShipping,
          taxable: values.taxable,
          taxOverridePercent: values.taxOverridePercent,
          isBundle: values.isBundle,
        });
        setValues(blankForm);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <TextInput label="Name" value={values.name} onChange={(v) => update("name", v)} />
        <TextInput label="Pack (e.g. 500g Pack)" value={values.pack} onChange={(v) => update("pack", v)} />

        <NumberInput
          label="Price"
          value={values.price}
          onChange={(v) => update("price", v ?? 0)}
        />
        <NumberInput
          label="Compare-at price (optional)"
          value={values.compareAtPrice}
          onChange={(v) => update("compareAtPrice", v)}
          allowNull
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Category</label>
          <select
            value={values.categoryId}
            onChange={(e) => update("categoryId", e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-dark-green focus:outline-none focus:ring-1 focus:ring-dark-green"
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Brand</label>
          <select
            value={values.brandId}
            onChange={(e) => update("brandId", e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-dark-green focus:outline-none focus:ring-1 focus:ring-dark-green"
          >
            <option value="">No brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Rating (1-5)</label>
          <input
            type="number"
            min={1}
            max={5}
            value={values.rating}
            onChange={(e) => update("rating", Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-dark-green focus:outline-none focus:ring-1 focus:ring-dark-green"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <ToggleField
          label="In Stock"
          checked={values.inStock}
          onChange={(v) => update("inStock", v)}
        />
        <ToggleField
          label="Discount Active"
          checked={values.discountActive}
          onChange={(v) => update("discountActive", v)}
        />
        <ToggleField
          label="Charge Shipping"
          checked={values.chargeShipping}
          onChange={(v) => update("chargeShipping", v)}
        />
        <ToggleField
          label="Taxable"
          checked={values.taxable}
          onChange={(v) => update("taxable", v)}
        />
        <ToggleField
          label="Is this a bundle deal?"
          checked={values.isBundle}
          onChange={(v) => update("isBundle", v)}
        />
      </div>

      {values.isBundle && (
        <p className="rounded-md bg-brand-green/10 px-3 py-2 text-xs text-dark-green">
          This creates a bundle as its own product listing. Set the bundle price below (and an
          optional Compare-at price to show savings), and upload a photo showing the bundle (e.g.
          two items together) using the same photo field as any product — no other setup needed.
        </p>
      )}

      <NumberInput
        label="Override Tax % (optional — blank uses the global rate)"
        value={values.taxOverridePercent}
        onChange={(v) => update("taxOverridePercent", v)}
        allowNull
      />

      <ImageUploadField
        label="Image"
        value={values.image}
        onChange={(url) => update("image", url)}
        onUploadingChange={setIsImageUploading}
      />

      <TextareaField
        label="Detailed Description (optional — shown in a 'Product Details' section on the product page)"
        value={values.detailedDescription}
        onChange={(v) => update("detailedDescription", v)}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || isImageUploading}
          className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isImageUploading ? "Waiting for image upload..." : isPending ? "Saving..." : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

