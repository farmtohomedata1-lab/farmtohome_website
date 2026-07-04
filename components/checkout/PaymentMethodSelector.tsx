"use client";

export type PaymentMethod = "COD" | "PAYNOW_MANUAL";

export default function PaymentMethodSelector({
  value,
  onChange,
}: {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
}) {
  const options: { value: PaymentMethod; label: string; description: string }[] = [
    { value: "COD", label: "Cash on Delivery", description: "Pay in cash when your order arrives." },
    {
      value: "PAYNOW_MANUAL",
      label: "PayNow",
      description: "Scan a QR code to pay — we'll confirm it shortly after.",
    },
  ];

  return (
    <div className="space-y-3">
      {options.map((option) => (
        <label
          key={option.value}
          className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm ${
            value === option.value ? "border-brand-green bg-brand-green/5" : "border-gray-200"
          }`}
        >
          <input
            type="radio"
            name="paymentMethod"
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="mt-1 h-4 w-4 text-brand-green focus:ring-brand-green"
          />
          <span>
            <span className="block font-semibold text-gray-900">{option.label}</span>
            <span className="block text-gray-500">{option.description}</span>
          </span>
        </label>
      ))}
    </div>
  );
}
