"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { SectionDef } from "@/lib/cms/sections.config";
import Switch from "@/components/admin/Switch";
import SectionForm from "./SectionForm";
import { toggleSectionEnabled } from "./actions";

export default function SectionCard({
  section,
  enabled: initialEnabled,
  content,
  productCount,
}: {
  section: SectionDef;
  enabled: boolean;
  content: Record<string, unknown>;
  productCount?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    startTransition(async () => {
      const result = await toggleSectionEnabled(section, next);
      if (result?.error) {
        setEnabled(!next);
      }
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <span
            className={`text-gray-400 transition-transform ${expanded ? "rotate-90" : ""}`}
            aria-hidden="true"
          >
            ›
          </span>
          <span className="font-semibold text-gray-900">{section.label}</span>
        </button>
        <Switch checked={enabled} onChange={handleToggle} disabled={isPending} label={`Toggle ${section.label}`} />
      </div>

      {expanded && (
        <div className="space-y-5 border-t border-gray-100 px-5 py-5">
          {section.productTag && (
            <div className="flex items-center justify-between rounded-md bg-gray-50 px-4 py-3">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{productCount ?? 0}</span>{" "}
                product{(productCount ?? 0) === 1 ? "" : "s"} tagged &ldquo;{section.label}&rdquo;
              </p>
              <Link
                href={`/admin/products?tag=${section.productTag}`}
                className="rounded-md bg-dark-green px-3 py-1.5 text-xs font-semibold text-white"
              >
                Manage in Products
              </Link>
            </div>
          )}
          <SectionForm section={section} initialContent={content} />
        </div>
      )}
    </div>
  );
}
