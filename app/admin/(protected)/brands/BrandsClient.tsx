"use client";

import { useState, useTransition } from "react";
import { createBrand, deleteBrand, updateBrand } from "./actions";

export interface AdminBrand {
  id: string;
  name: string;
  productCount: number;
}

export default function BrandsClient({ initialBrands }: { initialBrands: AdminBrand[] }) {
  const [brands, setBrands] = useState(initialBrands);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setShowAddForm((v) => !v)}
        className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white"
      >
        {showAddForm ? "Cancel" : "+ Add Brand"}
      </button>

      {showAddForm && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-5">
          <NameForm
            submitLabel="Add Brand"
            onSubmit={async (name) => {
              const result = await createBrand(name);
              if (!result.error) setShowAddForm(false);
              return result;
            }}
            onCreated={(brand) => setBrands((prev) => [...prev, brand])}
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {brands.length === 0 && (
          <p className="rounded-md border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
            No brands yet. The Brand filter is hidden on the Shop page until you add one.
          </p>
        )}
        {brands.map((brand) => (
          <BrandRow
            key={brand.id}
            brand={brand}
            onUpdated={(updated) =>
              setBrands((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
            }
            onDeleted={(id) => setBrands((prev) => prev.filter((b) => b.id !== id))}
          />
        ))}
      </div>
    </div>
  );
}

function BrandRow({
  brand,
  onUpdated,
  onDeleted,
}: {
  brand: AdminBrand;
  onUpdated: (brand: AdminBrand) => void;
  onDeleted: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleDelete() {
    const warning =
      brand.productCount > 0
        ? `Delete "${brand.name}"? ${brand.productCount} product(s) using it will become unbranded. This can't be undone.`
        : `Delete "${brand.name}"? This can't be undone.`;
    if (!window.confirm(warning)) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteBrand(brand.id);
      if (result.error) {
        setDeleteError(result.error);
      } else {
        onDeleted(brand.id);
      }
    });
  }

  if (isEditing) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <NameForm
          initialName={brand.name}
          submitLabel="Save"
          onSubmit={(name) => updateBrand(brand.id, name)}
          onCreated={() => {}}
          onSaved={(name) => {
            onUpdated({ ...brand, name });
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">{brand.name}</p>
        <p className="text-xs text-gray-500">
          {brand.productCount} product{brand.productCount === 1 ? "" : "s"}
        </p>
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

function NameForm({
  initialName = "",
  submitLabel,
  onSubmit,
  onCreated,
  onSaved,
  onCancel,
}: {
  initialName?: string;
  submitLabel: string;
  onSubmit: (name: string) => Promise<{ error?: string; id?: string }>;
  onCreated: (brand: AdminBrand) => void;
  onSaved?: (name: string) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await onSubmit(name);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (onSaved) {
        onSaved(name);
      } else {
        // Real DB id from the server, so delete/edit work without a refresh.
        onCreated({ id: result.id ?? crypto.randomUUID(), name, productCount: 0 });
        setName("");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-dark-green focus:outline-none focus:ring-1 focus:ring-dark-green"
        />
      </div>

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
