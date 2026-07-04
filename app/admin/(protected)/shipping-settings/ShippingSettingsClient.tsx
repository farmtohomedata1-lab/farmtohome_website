"use client";

import { useState, useTransition } from "react";
import NumberInput from "@/components/admin/NumberInput";
import ImageUploadField from "../cms/ImageUploadField";
import { updateSiteSettings } from "./actions";

export default function ShippingSettingsClient({
  id,
  freeShippingThreshold,
  standardDeliveryFee,
  paynowQrImageUrl,
}: {
  id: string;
  freeShippingThreshold: number;
  standardDeliveryFee: number;
  paynowQrImageUrl: string;
}) {
  const [threshold, setThreshold] = useState(freeShippingThreshold);
  const [fee, setFee] = useState(standardDeliveryFee);
  const [qrImageUrl, setQrImageUrl] = useState(paynowQrImageUrl);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateSiteSettings(id, {
        freeShippingThreshold: threshold,
        standardDeliveryFee: fee,
        paynowQrImageUrl: qrImageUrl,
      });
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Saved." });
      }
    });
  }

  return (
    <div className="mt-6 max-w-md rounded-lg border border-gray-200 bg-white p-5">
      <div className="grid grid-cols-1 gap-4">
        <NumberInput
          label="Free Shipping Threshold ($)"
          value={threshold}
          onChange={(v) => setThreshold(v ?? 0)}
        />
        <NumberInput
          label="Standard Delivery Fee ($)"
          value={fee}
          onChange={(v) => setFee(v ?? 0)}
        />
        <ImageUploadField
          label="PayNow QR Code"
          value={qrImageUrl}
          onChange={(url) => setQrImageUrl(url)}
        />
      </div>

      {message && (
        <p className={`mt-3 text-sm ${message.type === "error" ? "text-red-600" : "text-brand-green"}`}>
          {message.text}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="mt-4 rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
