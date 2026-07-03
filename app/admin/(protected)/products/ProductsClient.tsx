"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import type { SelectOption } from "@/lib/cms/sections.config";
import ImageUploadField from "../cms/ImageUploadField";
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
  price: string;
  oldPrice: string;
  rating: number;
  image: string;
  featuredTags: string[];
}

const blankForm: ProductFormValues = {
  name: "",
  pack: "",
  price: "",
  oldPrice: "",
  rating: 5,
  image: "",
};

export default function ProductsClient({
  initialProducts,
  availableTags,
  activeTag,
}: {
  initialProducts: AdminProduct[];
  availableTags: SelectOption[];
  activeTag?: string;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [showAddForm, setShowAddForm] = useState(false);

  const activeTagLabel = availableTags.find((t) => t.value === activeTag)?.label;

  return (
    <div className="mt-6">
      {activeTag && (
        <div className="mb-4 flex items-center justify-between rounded-md bg-brand-green/10 px-4 py-2.5 text-sm text-dark-green">
          <span>
            Showing products tagged <strong>{activeTagLabel ?? activeTag}</strong>
          </span>
          <Link href="/admin/products" className="font-semibold underline">
            Clear filter
          </Link>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowAddForm((v) => !v)}
        className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white"
      >
        {showAddForm ? "Cancel" : "+ Add Product"}
      </button>

      {showAddForm && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-5">
          <ProductForm
            initialValues={blankForm}
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
            No products{activeTag ? " with this tag" : ""} yet.
          </p>
        )}
        {products.map((product) => (
          <ProductRow
            key={product.id}
            product={product}
            availableTags={availableTags}
            onUpdated={(updated) =>
              setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
            }
            onDeleted={(id) => setProducts((prev) => prev.filter((p) => p.id !== id))}
          />
        ))}
      </div>
    </div>
  );
}

function ProductRow({
  product,
  availableTags,
  onUpdated,
  onDeleted,
}: {
  product: AdminProduct;
  availableTags: SelectOption[];
  onUpdated: (product: AdminProduct) => void;
  onDeleted: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [tags, setTags] = useState(product.featuredTags);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleToggleTag(tag: string, checked: boolean) {
    const previous = tags;
    const next = checked ? [...tags, tag] : tags.filter((t) => t !== tag);
    setTags(next);
    startTransition(async () => {
      const result = await toggleProductTag(product.id, tag, checked);
      if (result.error) setTags(previous);
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
            oldPrice: product.oldPrice,
            rating: product.rating,
            image: product.image,
          }}
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

  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
      {product.image ? (
        <Image
          src={product.image}
          alt={product.name}
          width={56}
          height={56}
          unoptimized
          className="h-14 w-14 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-gray-100 text-[10px] text-gray-400">
          No image
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">{product.name}</p>
        <p className="text-xs text-gray-500">
          {product.pack && `${product.pack} · `}
          {product.price}
          {product.oldPrice && <span className="ml-1 line-through">{product.oldPrice}</span>}
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
    </div>
  );
}

function ProductForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCreated,
  onSaved,
  onCancel,
}: {
  initialValues: ProductFormValues;
  submitLabel: string;
  onSubmit: (values: ProductFormValues) => Promise<{ error?: string }>;
  onCreated: (product: AdminProduct) => void;
  onSaved?: (values: ProductFormValues) => void;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState(initialValues);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
          oldPrice: values.oldPrice,
          rating: values.rating,
          image: values.image,
          featuredTags: [],
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
        <TextInput label="Price (e.g. $36.00)" value={values.price} onChange={(v) => update("price", v)} />
        <TextInput
          label="Old Price (optional)"
          value={values.oldPrice}
          onChange={(v) => update("oldPrice", v)}
        />
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

      <ImageUploadField label="Image" value={values.image} onChange={(url) => update("image", url)} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "Saving..." : submitLabel}
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

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-dark-green focus:outline-none focus:ring-1 focus:ring-dark-green"
      />
    </div>
  );
}
