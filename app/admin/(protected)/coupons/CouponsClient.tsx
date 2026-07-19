"use client";

import { useState, useTransition } from "react";
import TextInput from "@/components/admin/TextInput";
import NumberInput from "@/components/admin/NumberInput";
import ToggleField from "@/components/admin/ToggleField";
import { formatPrice } from "@/lib/format";
import {
  createCoupon,
  deleteCoupon,
  setCouponsEnabled,
  updateCoupon,
  type CouponFormValues,
} from "./actions";

export interface AdminCoupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  active: boolean;
  startDate: string;
  endDate: string;
}

const blankForm: CouponFormValues = {
  code: "",
  discountType: "PERCENTAGE",
  discountValue: 10,
  active: true,
  startDate: "",
  endDate: "",
};

function formatDiscount(coupon: Pick<AdminCoupon, "discountType" | "discountValue">): string {
  return coupon.discountType === "PERCENTAGE"
    ? `${coupon.discountValue}% off`
    : `${formatPrice(coupon.discountValue)} off`;
}

export default function CouponsClient({
  settingsId,
  initialCouponsEnabled,
  initialCoupons,
}: {
  settingsId: string;
  initialCouponsEnabled: boolean;
  initialCoupons: AdminCoupon[];
}) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [showAddForm, setShowAddForm] = useState(false);
  const [couponsEnabled, setCouponsEnabledState] = useState(initialCouponsEnabled);
  const [isTogglePending, startToggleTransition] = useTransition();
  const [toggleError, setToggleError] = useState<string | null>(null);

  function handleToggleCoupons(next: boolean) {
    setCouponsEnabledState(next);
    setToggleError(null);
    startToggleTransition(async () => {
      const result = await setCouponsEnabled(settingsId, next);
      if (result.error) {
        setCouponsEnabledState(!next);
        setToggleError(result.error);
      }
    });
  }

  return (
    <div className="mt-6">
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <ToggleField
          label="Coupons Enabled"
          checked={couponsEnabled}
          onChange={handleToggleCoupons}
        />
        <p className="mt-1.5 text-xs text-gray-500">
          When off, the coupon code field is completely hidden on Cart and Checkout — not just
          disabled.
        </p>
        {isTogglePending && <p className="mt-1.5 text-xs text-gray-400">Saving...</p>}
        {toggleError && <p className="mt-1.5 text-xs text-red-600">{toggleError}</p>}
      </div>

      <button
        type="button"
        onClick={() => setShowAddForm((v) => !v)}
        className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white"
      >
        {showAddForm ? "Cancel" : "+ Add Coupon"}
      </button>

      {showAddForm && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-5">
          <CouponForm
            initialValues={blankForm}
            submitLabel="Add Coupon"
            onSubmit={async (values) => {
              const result = await createCoupon(values);
              if (!result.error) setShowAddForm(false);
              return result;
            }}
            onCreated={(coupon) => setCoupons((prev) => [coupon, ...prev])}
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {coupons.length === 0 && (
          <p className="rounded-md border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
            No coupons yet.
          </p>
        )}
        {coupons.map((coupon) => (
          <CouponRow
            key={coupon.id}
            coupon={coupon}
            onUpdated={(updated) =>
              setCoupons((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
            }
            onDeleted={(id) => setCoupons((prev) => prev.filter((c) => c.id !== id))}
          />
        ))}
      </div>
    </div>
  );
}

function CouponRow({
  coupon,
  onUpdated,
  onDeleted,
}: {
  coupon: AdminCoupon;
  onUpdated: (coupon: AdminCoupon) => void;
  onDeleted: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleDelete() {
    if (!window.confirm(`Delete coupon "${coupon.code}"? This can't be undone.`)) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteCoupon(coupon.id);
      if (result.error) {
        setDeleteError(result.error);
      } else {
        onDeleted(coupon.id);
      }
    });
  }

  if (isEditing) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <CouponForm
          initialValues={{
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            active: coupon.active,
            startDate: coupon.startDate,
            endDate: coupon.endDate,
          }}
          submitLabel="Save"
          onSubmit={(values) => updateCoupon(coupon.id, values)}
          onCreated={() => {}}
          onSaved={(values) => {
            onUpdated({ ...coupon, ...values, code: values.code.trim().toUpperCase() });
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  const now = new Date();
  const isExpired = coupon.endDate && coupon.endDate < now.toISOString().slice(0, 10);
  const isUpcoming = coupon.startDate && coupon.startDate > now.toISOString().slice(0, 10);

  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">
          {coupon.code}
          {!coupon.active && (
            <span className="ml-2 rounded-sm bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gray-500">
              Inactive
            </span>
          )}
          {coupon.active && isExpired && (
            <span className="ml-2 rounded-sm bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-600">
              Expired
            </span>
          )}
          {coupon.active && isUpcoming && (
            <span className="ml-2 rounded-sm bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-dark-green">
              Upcoming
            </span>
          )}
        </p>
        <p className="text-xs text-gray-500">
          {formatDiscount(coupon)}
          {(coupon.startDate || coupon.endDate) && (
            <span className="ml-1">
              · {coupon.startDate || "any time"} – {coupon.endDate || "no end date"}
            </span>
          )}
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

function CouponForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCreated,
  onSaved,
  onCancel,
}: {
  initialValues: CouponFormValues;
  submitLabel: string;
  onSubmit: (values: CouponFormValues) => Promise<{ error?: string; id?: string }>;
  onCreated: (coupon: AdminCoupon) => void;
  onSaved?: (values: CouponFormValues) => void;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState(initialValues);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof CouponFormValues>(key: K, value: CouponFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await onSubmit(values);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (onSaved) {
        onSaved(values);
      } else {
        onCreated({
          // Real DB id from the server, so delete/edit work without a refresh.
          id: result.id ?? crypto.randomUUID(),
          code: values.code.trim().toUpperCase(),
          discountType: values.discountType,
          discountValue: values.discountValue,
          active: values.active,
          startDate: values.startDate,
          endDate: values.endDate,
        });
        setValues(blankForm);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <TextInput
          label="Code (e.g. MONSOON10)"
          value={values.code}
          onChange={(v) => update("code", v)}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Discount Type</label>
          <select
            value={values.discountType}
            onChange={(e) => update("discountType", e.target.value as "PERCENTAGE" | "FIXED")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-dark-green focus:outline-none focus:ring-1 focus:ring-dark-green"
          >
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED">Fixed Amount</option>
          </select>
        </div>

        <NumberInput
          label={values.discountType === "PERCENTAGE" ? "Discount Value (%)" : "Discount Value ($)"}
          value={values.discountValue}
          onChange={(v) => update("discountValue", v ?? 0)}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Start Date (optional)
          </label>
          <input
            type="date"
            value={values.startDate}
            onChange={(e) => update("startDate", e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-dark-green focus:outline-none focus:ring-1 focus:ring-dark-green"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            End Date (optional)
          </label>
          <input
            type="date"
            value={values.endDate}
            onChange={(e) => update("endDate", e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-dark-green focus:outline-none focus:ring-1 focus:ring-dark-green"
          />
        </div>
      </div>

      <ToggleField label="Active" checked={values.active} onChange={(v) => update("active", v)} />

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
