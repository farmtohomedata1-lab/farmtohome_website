"use client";

import { useState, useTransition } from "react";
import TextInput from "@/components/admin/TextInput";
import ToggleField from "@/components/admin/ToggleField";
import {
  createAddress,
  deleteAddress,
  setDefaultAddress,
  updateAddress,
  type AddressFormValues,
} from "@/app/account/actions";

export interface AccountAddress {
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

const blankForm: AddressFormValues = {
  label: "",
  fullName: "",
  phone: "",
  blockStreet: "",
  unitNumber: "",
  postalCode: "",
  landmark: "",
  country: "",
  isDefault: false,
};

export default function AddressesSection({
  initialAddresses,
}: {
  initialAddresses: AccountAddress[];
}) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-dark-green">Saved Addresses</h2>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="rounded-md bg-brand-green px-3 py-1.5 text-xs font-semibold text-white"
        >
          {showAddForm ? "Cancel" : "+ Add Address"}
        </button>
      </div>

      {showAddForm && (
        <div className="mt-4 rounded-md border border-gray-200 p-4">
          <AddressForm
            initialValues={blankForm}
            submitLabel="Add Address"
            onSubmit={async (values) => {
              const result = await createAddress(values);
              if (!result.error) setShowAddForm(false);
              return result;
            }}
            onCreated={(address) => setAddresses((prev) => [...prev, address])}
          />
        </div>
      )}

      <div className="mt-4 space-y-3">
        {addresses.length === 0 && (
          <p className="text-sm text-gray-500">No saved addresses yet.</p>
        )}
        {addresses.map((address) => (
          <AddressRow
            key={address.id}
            address={address}
            onUpdated={(updated) =>
              setAddresses((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
            }
            onDeleted={(id) => setAddresses((prev) => prev.filter((a) => a.id !== id))}
          />
        ))}
      </div>
    </section>
  );
}

function AddressRow({
  address,
  onUpdated,
  onDeleted,
}: {
  address: AccountAddress;
  onUpdated: (address: AccountAddress) => void;
  onDeleted: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!window.confirm("Delete this address? This can't be undone.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteAddress(address.id);
      if (result.error) setError(result.error);
      else onDeleted(address.id);
    });
  }

  function handleSetDefault() {
    startTransition(async () => {
      const result = await setDefaultAddress(address.id);
      if (!result.error) onUpdated({ ...address, isDefault: true });
    });
  }

  if (isEditing) {
    return (
      <div className="rounded-md border border-gray-200 p-4">
        <AddressForm
          initialValues={{
            label: address.label,
            fullName: address.fullName,
            phone: address.phone,
            blockStreet: address.blockStreet,
            unitNumber: address.unitNumber,
            postalCode: address.postalCode,
            landmark: address.landmark,
            // Every saved address is already implicitly Singapore (the only
            // option this business ships to) — pre-fill it here rather than
            // forcing re-selection of data that's already known-good.
            country: "Singapore",
            isDefault: address.isDefault,
          }}
          submitLabel="Save"
          onSubmit={(values) => updateAddress(address.id, values)}
          onCreated={() => {}}
          onSaved={(values) => {
            onUpdated({ ...address, ...values });
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="rounded-md border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">
            {address.label || "Address"}
            {address.isDefault && (
              <span className="ml-2 rounded-sm bg-brand-green/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-green">
                Default
              </span>
            )}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {address.fullName} · {address.phone}
          </p>
          <p className="text-sm text-gray-500">
            {address.blockStreet}
            {address.unitNumber ? `, ${address.unitNumber}` : ""}, Singapore{" "}
            {address.postalCode}
          </p>
          {address.landmark && (
            <p className="text-xs text-gray-400">Landmark: {address.landmark}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex gap-2">
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
          {!address.isDefault && (
            <button
              type="button"
              onClick={handleSetDefault}
              disabled={isPending}
              className="text-xs font-semibold text-brand-green hover:underline disabled:opacity-60"
            >
              Set as default
            </button>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function AddressForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCreated,
  onSaved,
  onCancel,
}: {
  initialValues: AddressFormValues;
  submitLabel: string;
  onSubmit: (values: AddressFormValues) => Promise<{ error?: string }>;
  onCreated: (address: AccountAddress) => void;
  onSaved?: (values: AddressFormValues) => void;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState(initialValues);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [countryError, setCountryError] = useState<string | null>(null);

  function update<K extends keyof AddressFormValues>(key: K, value: AddressFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    setError(null);

    if (!values.country.trim()) {
      setCountryError("Please select a country.");
      return;
    }
    setCountryError(null);

    startTransition(async () => {
      const result = await onSubmit(values);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (onSaved) {
        onSaved(values);
      } else {
        onCreated({ id: crypto.randomUUID(), ...values });
        setValues(blankForm);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextInput
          label="Label (e.g. Home, Office)"
          value={values.label}
          onChange={(v) => update("label", v)}
        />
        <TextInput label="Full Name" value={values.fullName} onChange={(v) => update("fullName", v)} />
        <TextInput label="Phone" value={values.phone} onChange={(v) => update("phone", v)} />
        <TextInput
          label="Block / Street (e.g. Blk 258, Farrer Road)"
          value={values.blockStreet}
          onChange={(v) => update("blockStreet", v)}
        />
        <TextInput
          label="Unit Number (optional)"
          value={values.unitNumber}
          onChange={(v) => update("unitNumber", v)}
        />
        <TextInput
          label="Postal Code"
          value={values.postalCode}
          onChange={(v) => update("postalCode", v)}
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Country</label>
          <select
            value={values.country}
            onChange={(e) => update("country", e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-dark-green focus:outline-none focus:ring-1 focus:ring-dark-green"
          >
            <option value="" disabled hidden>
              Select Country
            </option>
            <option value="Singapore">Singapore</option>
          </select>
          {countryError && <p className="mt-1 text-xs text-red-600">{countryError}</p>}
        </div>
        <TextInput
          label="Landmark (optional)"
          value={values.landmark}
          onChange={(v) => update("landmark", v)}
        />
      </div>

      <ToggleField
        label="Set as default address"
        checked={values.isDefault}
        onChange={(v) => update("isDefault", v)}
      />

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
