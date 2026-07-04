"use client";

import { useState, useTransition } from "react";
import { createCategory, deleteCategory, updateCategory } from "./actions";

export interface AdminCategory {
  id: string;
  name: string;
  productCount: number;
}

export default function CategoriesClient({
  initialCategories,
}: {
  initialCategories: AdminCategory[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setShowAddForm((v) => !v)}
        className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white"
      >
        {showAddForm ? "Cancel" : "+ Add Category"}
      </button>

      {showAddForm && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-5">
          <NameForm
            submitLabel="Add Category"
            onSubmit={async (name) => {
              const result = await createCategory(name);
              if (!result.error) setShowAddForm(false);
              return result;
            }}
            onCreated={(category) => setCategories((prev) => [...prev, category])}
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {categories.length === 0 && (
          <p className="rounded-md border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
            No categories yet. The Category filter is hidden on the Shop page until you add one.
          </p>
        )}
        {categories.map((category) => (
          <CategoryRow
            key={category.id}
            category={category}
            onUpdated={(updated) =>
              setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
            }
            onDeleted={(id) => setCategories((prev) => prev.filter((c) => c.id !== id))}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  onUpdated,
  onDeleted,
}: {
  category: AdminCategory;
  onUpdated: (category: AdminCategory) => void;
  onDeleted: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleDelete() {
    const warning =
      category.productCount > 0
        ? `Delete "${category.name}"? ${category.productCount} product(s) using it will become uncategorized. This can't be undone.`
        : `Delete "${category.name}"? This can't be undone.`;
    if (!window.confirm(warning)) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteCategory(category.id);
      if (result.error) {
        setDeleteError(result.error);
      } else {
        onDeleted(category.id);
      }
    });
  }

  if (isEditing) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <NameForm
          initialName={category.name}
          submitLabel="Save"
          onSubmit={(name) => updateCategory(category.id, name)}
          onCreated={() => {}}
          onSaved={(name) => {
            onUpdated({ ...category, name });
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
        <p className="truncate text-sm font-semibold text-gray-900">{category.name}</p>
        <p className="text-xs text-gray-500">
          {category.productCount} product{category.productCount === 1 ? "" : "s"}
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
  onSubmit: (name: string) => Promise<{ error?: string }>;
  onCreated: (category: AdminCategory) => void;
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
        onCreated({ id: crypto.randomUUID(), name, productCount: 0 });
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
