"use client";

import { useId } from "react";
import type { FieldDef, ScalarFieldDef } from "@/lib/cms/sections.config";
import ImageUploadField from "./ImageUploadField";

// Renders one top-level field of a section form. "objectList" fields render
// a repeatable set of mini-cards, each built from the same scalar renderer
// (one level of nesting only — sufficient for every section in this CMS).
export default function FieldRenderer({
  field,
  value,
  onChange,
  onImageUploadingChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  onImageUploadingChange?: (uploading: boolean) => void;
}) {
  if (field.type === "objectList") {
    const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
    const itemFields = field.itemFields;
    const atMax = field.maxItems != null && items.length >= field.maxItems;

    function updateItem(index: number, key: string, itemValue: unknown) {
      const next = items.map((item, i) => (i === index ? { ...item, [key]: itemValue } : item));
      onChange(next);
    }

    function removeItem(index: number) {
      onChange(items.filter((_, i) => i !== index));
    }

    function addItem() {
      const blank: Record<string, unknown> = { id: crypto.randomUUID() };
      for (const itemField of itemFields) {
        blank[itemField.key] = itemField.type === "select" ? itemField.options?.[0]?.value ?? "" : "";
      }
      onChange([...items, blank]);
    }

    return (
      <div>
        <span className="mb-2 block text-sm font-medium text-gray-700">{field.label}</span>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={(item.id as string) ?? index}
              className="rounded-md border border-gray-200 bg-gray-50 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">
                  {field.itemLabel} {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
              <div className="space-y-3">
                {itemFields.map((itemField) => (
                  <ScalarField
                    key={itemField.key}
                    field={itemField}
                    value={item[itemField.key]}
                    onChange={(v) => updateItem(index, itemField.key, v)}
                    onImageUploadingChange={onImageUploadingChange}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        {atMax ? (
          <p className="mt-3 text-xs text-gray-400">
            Maximum of {field.maxItems} reached — remove one to add another.
          </p>
        ) : (
          <button
            type="button"
            onClick={addItem}
            className="mt-3 rounded-md border border-brand-green px-3 py-1.5 text-xs font-semibold text-brand-green hover:bg-brand-green/5"
          >
            + Add {field.itemLabel}
          </button>
        )}
      </div>
    );
  }

  if (field.type === "stringList") {
    const items = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div>
        <label htmlFor={field.key} className="mb-1.5 block text-sm font-medium text-gray-700">
          {field.label}
        </label>
        <textarea
          id={field.key}
          rows={5}
          value={items.join("\n")}
          onChange={(e) =>
            onChange(
              e.target.value
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
            )
          }
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-dark-green focus:outline-none focus:ring-1 focus:ring-dark-green"
        />
      </div>
    );
  }

  return (
    <ScalarField
      field={field}
      value={value}
      onChange={onChange}
      onImageUploadingChange={onImageUploadingChange}
    />
  );
}

function ScalarField({
  field,
  value,
  onChange,
  onImageUploadingChange,
}: {
  field: ScalarFieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  onImageUploadingChange?: (uploading: boolean) => void;
}) {
  const id = useId();
  const stringValue = typeof value === "string" ? value : "";

  if (field.type === "image") {
    return (
      <ImageUploadField
        label={field.label}
        value={stringValue}
        onChange={onChange}
        onUploadingChange={onImageUploadingChange}
      />
    );
  }

  if (field.type === "select") {
    return (
      <div>
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
          {field.label}
        </label>
        <select
          id={id}
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-dark-green focus:outline-none focus:ring-1 focus:ring-dark-green"
        >
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div>
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
          {field.label}
        </label>
        <textarea
          id={id}
          rows={3}
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-dark-green focus:outline-none focus:ring-1 focus:ring-dark-green"
        />
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {field.label}
      </label>
      <input
        id={id}
        type="text"
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-dark-green focus:outline-none focus:ring-1 focus:ring-dark-green"
      />
    </div>
  );
}
