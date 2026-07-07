"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuthedCustomer } from "@/lib/auth/customerSession";

export interface AddressFormValues {
  label: string;
  fullName: string;
  phone: string;
  blockStreet: string;
  unitNumber: string;
  postalCode: string;
  landmark: string;
  country: string;
  isDefault: boolean;
}

function validateAddress(values: AddressFormValues): string | null {
  if (!values.fullName.trim()) return "Full name is required.";
  if (!values.phone.trim()) return "Phone number is required.";
  if (!values.blockStreet.trim()) return "Address is required.";
  if (!/^\d{6}$/.test(values.postalCode.trim())) return "Enter a valid 6-digit postal code.";
  // Only one real option exists ("Singapore") but the selection is never
  // silently assumed — same never-trust-the-client principle as every other
  // required field here, in case a client bypasses the dropdown UI.
  if (values.country.trim() !== "Singapore") return "Please select a country.";
  return null;
}

export async function updateProfileName(name: string): Promise<{ error?: string }> {
  const customer = await requireAuthedCustomer("/account");

  try {
    await prisma.customer.update({ where: { id: customer.id }, data: { name: name.trim() || null } });
  } catch (err) {
    console.error(`[account] updateProfileName(${customer.id}) failed:`, err);
    return { error: "Failed to save. Please try again." };
  }

  revalidatePath("/account");
  return {};
}

export async function createAddress(values: AddressFormValues): Promise<{ error?: string }> {
  const customer = await requireAuthedCustomer("/account");

  const validationError = validateAddress(values);
  if (validationError) return { error: validationError };

  try {
    await prisma.$transaction(async (tx) => {
      if (values.isDefault) {
        await tx.address.updateMany({ where: { customerId: customer.id }, data: { isDefault: false } });
      }
      await tx.address.create({
        data: {
          customerId: customer.id,
          label: values.label.trim() || null,
          fullName: values.fullName.trim(),
          phone: values.phone.trim(),
          blockStreet: values.blockStreet.trim(),
          unitNumber: values.unitNumber.trim() || null,
          postalCode: values.postalCode.trim(),
          landmark: values.landmark.trim() || null,
          isDefault: values.isDefault,
        },
      });
    });
  } catch (err) {
    console.error(`[account] createAddress(${customer.id}) failed:`, err);
    return { error: "Failed to save address. Please try again." };
  }

  revalidatePath("/account");
  return {};
}

// Every mutation below is scoped to `customerId: customer.id` in the same
// `where` as the id lookup — never a bare `{ id }` — so one customer can
// never edit/delete another customer's address by guessing/passing its id.
export async function updateAddress(
  addressId: string,
  values: AddressFormValues
): Promise<{ error?: string }> {
  const customer = await requireAuthedCustomer("/account");

  const validationError = validateAddress(values);
  if (validationError) return { error: validationError };

  try {
    const existing = await prisma.address.findUnique({ where: { id: addressId } });
    if (!existing || existing.customerId !== customer.id) {
      return { error: "Address not found." };
    }

    await prisma.$transaction(async (tx) => {
      if (values.isDefault) {
        await tx.address.updateMany({ where: { customerId: customer.id }, data: { isDefault: false } });
      }
      await tx.address.update({
        where: { id: addressId },
        data: {
          label: values.label.trim() || null,
          fullName: values.fullName.trim(),
          phone: values.phone.trim(),
          blockStreet: values.blockStreet.trim(),
          unitNumber: values.unitNumber.trim() || null,
          postalCode: values.postalCode.trim(),
          landmark: values.landmark.trim() || null,
          isDefault: values.isDefault,
        },
      });
    });
  } catch (err) {
    console.error(`[account] updateAddress(${addressId}) failed:`, err);
    return { error: "Failed to save address. Please try again." };
  }

  revalidatePath("/account");
  return {};
}

export async function deleteAddress(addressId: string): Promise<{ error?: string }> {
  const customer = await requireAuthedCustomer("/account");

  try {
    const existing = await prisma.address.findUnique({ where: { id: addressId } });
    if (!existing || existing.customerId !== customer.id) {
      return { error: "Address not found." };
    }
    await prisma.address.delete({ where: { id: addressId } });
  } catch (err) {
    console.error(`[account] deleteAddress(${addressId}) failed:`, err);
    return { error: "Failed to delete address. Please try again." };
  }

  revalidatePath("/account");
  return {};
}

export async function setDefaultAddress(addressId: string): Promise<{ error?: string }> {
  const customer = await requireAuthedCustomer("/account");

  try {
    const existing = await prisma.address.findUnique({ where: { id: addressId } });
    if (!existing || existing.customerId !== customer.id) {
      return { error: "Address not found." };
    }

    await prisma.$transaction([
      prisma.address.updateMany({ where: { customerId: customer.id }, data: { isDefault: false } }),
      prisma.address.update({ where: { id: addressId }, data: { isDefault: true } }),
    ]);
  } catch (err) {
    console.error(`[account] setDefaultAddress(${addressId}) failed:`, err);
    return { error: "Failed to update. Please try again." };
  }

  revalidatePath("/account");
  return {};
}
