"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { uploadSectionImage } from "./actions";

export default function ImageUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File | null | undefined) {
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const result = await uploadSectionImage(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.url) {
        onChange(result.url);
      }
    });
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer items-center gap-4 rounded-md border border-dashed border-gray-300 p-3 transition-colors hover:border-dark-green"
      >
        {value ? (
          <Image
            src={value}
            alt=""
            width={64}
            height={64}
            unoptimized
            className="h-16 w-16 shrink-0 rounded object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-gray-100 text-[10px] text-gray-400">
            No image
          </div>
        )}
        <span className="text-sm text-gray-500">
          {isPending ? "Uploading..." : "Click or drop an image to replace"}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
