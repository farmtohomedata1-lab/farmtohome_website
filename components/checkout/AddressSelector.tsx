"use client";

import { useState } from "react";
import TextInput from "@/components/admin/TextInput";

export interface CheckoutAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  blockStreet: string;
  unitNumber: string;
  postalCode: string;
  landmark: string;
  isDefault: boolean;
}

export interface NewAddressValues {
  fullName: string;
  phone: string;
  blockStreet: string;
  unitNumber: string;
  postalCode: string;
  landmark: string;
}

export type NewAddressFieldErrors = Partial<Record<keyof NewAddressValues, string>>;

const NEW_ADDRESS_OPTION = "__new__";

// Field-level input, so labels/inline error text share one spot instead of
// AddressSelector re-implementing them per-field.
function AddressField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div>
      <TextInput label={label} value={value} onChange={onChange} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function AddressSelector({
  addresses,
  selectedAddressId,
  onSelect,
  newAddress,
  onNewAddressChange,
  fieldErrors,
}: {
  addresses: CheckoutAddress[];
  selectedAddressId: string | null; // null means "use new address"
  onSelect: (addressId: string | null) => void;
  newAddress: NewAddressValues;
  onNewAddressChange: (values: NewAddressValues) => void;
  fieldErrors?: NewAddressFieldErrors;
}) {
  // Collapsed by default whenever a saved address already exists and is
  // selected — "Enter a new address" is a secondary path, not shown with
  // empty fields up front. Opens automatically once the customer actually
  // picks it (selectedAddressId === null) or has no saved addresses yet.
  const [newAddressExpanded, setNewAddressExpanded] = useState(selectedAddressId === null);

  function update<K extends keyof NewAddressValues>(key: K, value: NewAddressValues[K]) {
    onNewAddressChange({ ...newAddress, [key]: value });
  }

  function handleSelectNew() {
    onSelect(null);
    setNewAddressExpanded(true);
  }

  const showNewAddressFields = selectedAddressId === null && newAddressExpanded;

  return (
    <div className="space-y-3">
      {addresses.map((address) => (
        <label
          key={address.id}
          className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm ${
            selectedAddressId === address.id
              ? "border-brand-green bg-brand-green/5"
              : "border-gray-200"
          }`}
        >
          <input
            type="radio"
            name="address"
            checked={selectedAddressId === address.id}
            onChange={() => onSelect(address.id)}
            className="mt-1 h-4 w-4 text-brand-green focus:ring-brand-green"
          />
          <span>
            <span className="font-semibold text-gray-900">
              {address.label || "Address"}
              {address.isDefault && (
                <span className="ml-2 rounded-sm bg-brand-green/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-green">
                  Default
                </span>
              )}
            </span>
            <span className="block text-gray-600">
              {address.fullName} · {address.phone}
            </span>
            <span className="block text-gray-500">
              {address.blockStreet}
              {address.unitNumber ? `, ${address.unitNumber}` : ""}, Singapore{" "}
              {address.postalCode}
            </span>
          </span>
        </label>
      ))}

      <label
        className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm ${
          selectedAddressId === null ? "border-brand-green bg-brand-green/5" : "border-gray-200"
        }`}
      >
        <input
          type="radio"
          name="address"
          value={NEW_ADDRESS_OPTION}
          checked={selectedAddressId === null}
          onChange={handleSelectNew}
          className="mt-1 h-4 w-4 text-brand-green focus:ring-brand-green"
        />
        <span className="font-semibold text-gray-900">Use a new address</span>
      </label>

      {showNewAddressFields && (
        <div className="rounded-md border border-gray-200 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AddressField
              label="Full Name"
              value={newAddress.fullName}
              onChange={(v) => update("fullName", v)}
              error={fieldErrors?.fullName}
            />
            <AddressField
              label="Phone"
              value={newAddress.phone}
              onChange={(v) => update("phone", v)}
              error={fieldErrors?.phone}
            />
            <AddressField
              label="Block / Street (e.g. Blk 258, Farrer Road)"
              value={newAddress.blockStreet}
              onChange={(v) => update("blockStreet", v)}
              error={fieldErrors?.blockStreet}
            />
            <AddressField
              label="Unit Number (optional)"
              value={newAddress.unitNumber}
              onChange={(v) => update("unitNumber", v)}
            />
            <AddressField
              label="Postal Code"
              value={newAddress.postalCode}
              onChange={(v) => update("postalCode", v)}
              error={fieldErrors?.postalCode}
            />
            <AddressField
              label="Landmark (optional)"
              value={newAddress.landmark}
              onChange={(v) => update("landmark", v)}
            />
          </div>
          <p className="mt-3 text-xs text-gray-400">
            This address will be saved to your account automatically after your order is placed.
          </p>
        </div>
      )}
    </div>
  );
}
