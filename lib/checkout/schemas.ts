// Runtime validation for cart/checkout Server Action inputs. These are the
// entry points a tampered request (dev-tools console, curl, a modified
// client bundle) can call directly with an arbitrary payload — TypeScript
// types are compile-time only and enforce nothing at runtime, so without
// this, malformed input reaches resolveLineItems/computeCartTotals unchecked.
//
// Concretely: a negative quantity is NOT rejected anywhere else in the
// pipeline. resolveLineItems (lib/orderPricing.ts) passes `item.quantity`
// straight through with no clamping, and computeCartTotals (lib/cartTotals.ts)
// is pure arithmetic with no bounds-checking of its own (by design — it
// trusts its caller to have validated). A crafted request mixing a normal
// item with one carrying a large negative quantity was confirmed, before
// this file existed, to drive an order's subtotal/total below zero — real
// money lost on real goods. MAX_QUANTITY_PER_ITEM/MAX_LINE_ITEMS below are
// deliberately generous (no real grocery order approaches them) but finite,
// so neither this exploit nor an accidental client bug (e.g. a stray "-1"
// from a broken stepper) can ever reach the pricing engine.
import { z } from "zod";

const MAX_QUANTITY_PER_ITEM = 999;
const MAX_LINE_ITEMS = 200;

export const pricedItemSchema = z.object({
  productId: z.string().min(1, "Missing product id."),
  quantity: z
    .number()
    .int("Quantity must be a whole number.")
    .min(1, "Quantity must be at least 1.")
    .max(MAX_QUANTITY_PER_ITEM, `Quantity cannot exceed ${MAX_QUANTITY_PER_ITEM} per item.`),
});

// Allows an empty array — used by validateCoupon, which can legitimately be
// called to preview a discount before any item exists in the cart.
export const pricedItemsSchema = z.array(pricedItemSchema).max(MAX_LINE_ITEMS);

// Same as pricedItemsSchema but requires at least one item — placeOrder can
// never legitimately run against an empty cart.
export const nonEmptyPricedItemsSchema = pricedItemsSchema.min(
  1,
  "Your cart is empty."
);

const placeOrderAddressSchema = z.object({
  addressId: z.string().min(1).optional(),
  fullName: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  blockStreet: z.string().max(300).optional(),
  unitNumber: z.string().max(50).optional(),
  postalCode: z.string().max(20).optional(),
  landmark: z.string().max(200).optional(),
  country: z.string().max(100).optional(),
});

export const placeOrderInputSchema = z.object({
  items: nonEmptyPricedItemsSchema,
  couponCode: z.string().max(50).nullable(),
  address: placeOrderAddressSchema,
  // Validated as "is it a string in the right shape", not parsed as a real
  // Date here — app/checkout/actions.ts already does `new Date(...)` and
  // treats an invalid result appropriately; this only guards against a
  // wildly wrong type (e.g. a number, object, or array) reaching that line.
  deliveryDate: z.string().max(50).nullable(),
  orderNotes: z.string().max(2000, "Order notes are too long."),
  paymentMethod: z.enum(["PAYNOW_MANUAL", "STRIPE"]),
});

// couponCode as a standalone input (validateCoupon's first argument) — same
// length cap as the field above, non-empty is checked separately by
// checkCoupon's own logic (an empty string there already returns a clear
// "Enter a coupon code." error), so this only guards the type/length.
export const couponCodeSchema = z.string().max(50);

export const orderIdSchema = z.string().min(1).max(100);
