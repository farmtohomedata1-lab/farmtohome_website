"use client";

// Guest cart — no login required, no server round-trip. Persisted to
// localStorage so it survives a page refresh, consistent with the rest of
// the site's "accounts are optional" rule (see CLAUDE.md).

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string | null;
  pack: string | null;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item, quantity) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        }),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
        })),
      clearCart: () => set({ items: [] }),
    }),
    { name: "cart-storage" }
  )
);

export function selectCartTotalCount(state: CartState): number {
  return state.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function selectCartTotalPrice(state: CartState): number {
  return state.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
}

// The live source of truth for "is this product in the cart, and how many."
// Every Add to Cart button / quantity stepper on the site reads through this
// (never local component state) so the same product shows the same quantity
// everywhere it appears, updating instantly with no page refresh.
export function useCartQuantity(productId: string): number {
  return useCartStore(
    (state) => state.items.find((item) => item.productId === productId)?.quantity ?? 0
  );
}
