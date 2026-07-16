"use client";

import { useState, useTransition } from "react";
import type { SectionDef } from "@/lib/cms/sections.config";
import FieldRenderer from "./FieldRenderer";
import { saveSectionContent } from "./actions";

export default function SectionForm({
  section,
  initialContent,
}: {
  section: SectionDef;
  initialContent: Record<string, unknown>;
}) {
  const { fields } = section;
  const [content, setContent] = useState(initialContent);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // A section can have several image fields uploading at once (Gallery,
  // objectList items like Carousel Images) — a counter (not a single
  // boolean) so one upload finishing doesn't prematurely re-enable Save
  // while another is still in flight.
  const [uploadingCount, setUploadingCount] = useState(0);

  function updateField(key: string, value: unknown) {
    setStatus("idle");
    setContent((prev) => ({ ...prev, [key]: value }));
  }

  function handleImageUploadingChange(uploading: boolean) {
    setUploadingCount((prev) => prev + (uploading ? 1 : -1));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveSectionContent(section, content);
      if (result?.error) {
        setStatus("error");
        setErrorMessage(result.error);
      } else {
        setStatus("saved");
      }
    });
  }

  return (
    <div className="space-y-5">
      {fields.map((field) => (
        <FieldRenderer
          key={field.key}
          field={field}
          value={content[field.key]}
          onChange={(value) => updateField(field.key, value)}
          onImageUploadingChange={handleImageUploadingChange}
        />
      ))}

      <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || uploadingCount > 0}
          className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        >
          {uploadingCount > 0 ? "Waiting for image upload..." : isPending ? "Saving..." : "Save"}
        </button>
        {status === "saved" && (
          <span className="text-sm font-medium text-green-600">Saved</span>
        )}
        {status === "error" && (
          <span className="text-sm font-medium text-red-600">{errorMessage}</span>
        )}
      </div>
    </div>
  );
}
