import { test } from "node:test";
import assert from "node:assert/strict";
import { placeOrderInputSchema, pricedItemsSchema, pricedItemSchema } from "./schemas";

// Regression guard for a confirmed, exploitable vulnerability: before this
// schema existed, resolveLineItems/computeCartTotals applied a client-supplied
// quantity with zero validation. A crafted request mixing one legitimate item
// with one carrying a large negative quantity was proven (against the real
// computeCartTotals function) to drive an order's total below zero -- real
// goods dispatched for negative money owed. These tests assert the schema
// that closes that hole keeps rejecting the exact shapes that exploited it.

test("pricedItemSchema: rejects a negative quantity", () => {
  const result = pricedItemSchema.safeParse({ productId: "prod_1", quantity: -50 });
  assert.equal(result.success, false);
});

test("pricedItemSchema: rejects a zero quantity", () => {
  const result = pricedItemSchema.safeParse({ productId: "prod_1", quantity: 0 });
  assert.equal(result.success, false);
});

test("pricedItemSchema: rejects a non-integer quantity", () => {
  const result = pricedItemSchema.safeParse({ productId: "prod_1", quantity: 1.5 });
  assert.equal(result.success, false);
});

test("pricedItemSchema: rejects a non-numeric quantity", () => {
  const result = pricedItemSchema.safeParse({ productId: "prod_1", quantity: "5" as unknown as number });
  assert.equal(result.success, false);
});

test("pricedItemSchema: rejects an absurdly large quantity", () => {
  const result = pricedItemSchema.safeParse({ productId: "prod_1", quantity: 999999999 });
  assert.equal(result.success, false);
});

test("pricedItemSchema: rejects a missing/empty productId", () => {
  assert.equal(pricedItemSchema.safeParse({ productId: "", quantity: 1 }).success, false);
  assert.equal(pricedItemSchema.safeParse({ quantity: 1 }).success, false);
});

test("pricedItemSchema: accepts a normal, valid item", () => {
  const result = pricedItemSchema.safeParse({ productId: "prod_1", quantity: 3 });
  assert.equal(result.success, true);
});

test("pricedItemsSchema: rejects if ANY item in the array is invalid (the mixed-attack shape)", () => {
  const result = pricedItemsSchema.safeParse([
    { productId: "prod_legit", quantity: 5 },
    { productId: "prod_attack", quantity: -50 },
  ]);
  assert.equal(result.success, false);
});

test("pricedItemsSchema: allows an empty array (coupon preview on an empty cart)", () => {
  assert.equal(pricedItemsSchema.safeParse([]).success, true);
});

test("placeOrderInputSchema: rejects the exact confirmed-exploit payload", () => {
  const result = placeOrderInputSchema.safeParse({
    items: [
      { productId: "prod_legit", quantity: 5 },
      { productId: "prod_attack", quantity: -50 },
    ],
    couponCode: null,
    address: { fullName: "Test", phone: "91234567", blockStreet: "1 Test St", postalCode: "123456", country: "Singapore" },
    deliveryDate: null,
    orderNotes: "",
    paymentMethod: "PAYNOW_MANUAL",
  });
  assert.equal(result.success, false);
});

test("placeOrderInputSchema: rejects an empty cart", () => {
  const result = placeOrderInputSchema.safeParse({
    items: [],
    couponCode: null,
    address: {},
    deliveryDate: null,
    orderNotes: "",
    paymentMethod: "PAYNOW_MANUAL",
  });
  assert.equal(result.success, false);
});

test("placeOrderInputSchema: rejects an invalid paymentMethod", () => {
  const result = placeOrderInputSchema.safeParse({
    items: [{ productId: "prod_1", quantity: 1 }],
    couponCode: null,
    address: {},
    deliveryDate: null,
    orderNotes: "",
    paymentMethod: "FREE_MONEY",
  });
  assert.equal(result.success, false);
});

test("placeOrderInputSchema: accepts a genuinely valid order", () => {
  const result = placeOrderInputSchema.safeParse({
    items: [{ productId: "prod_1", quantity: 2 }],
    couponCode: "SAVE10",
    address: { addressId: "addr_1" },
    deliveryDate: "2026-08-01",
    orderNotes: "Leave at the door",
    paymentMethod: "STRIPE",
  });
  assert.equal(result.success, true);
});
