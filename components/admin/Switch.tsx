"use client";

export default function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <span className="sr-only">{label}</span>
      <span className="text-xs font-medium text-gray-500">
        {checked ? "Enabled" : "Disabled"}
      </span>
      {/*
        Same flex + padding + translate-x-full knob as
        components/admin/ToggleField.tsx, so both admin toggles stay perfectly
        symmetric in ON and OFF without any per-size magic-number offsets.
      */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={onChange}
        className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors disabled:opacity-60 ${
          checked ? "bg-brand-green" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-full" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}
