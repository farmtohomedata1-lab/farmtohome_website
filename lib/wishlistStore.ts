"use client";

// Guest wishlist — no login required, no server round-trip. Same
// Zustand+localStorage pattern as lib/cartStore.ts. Items are shaped like
// ShopProduct so they can be rendered directly by ShopProductCard on
// /wishlist without any remapping.

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WishlistItem {
  id: string;
  name: string;
  pack: string | null;
  price: number;
  compareAtPrice: number | null;
  isOnSale: boolean;
  inStock: boolean;
  image: string | null;
}

interface WishlistState {
  items: WishlistItem[];
  toggleItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      items: [],
      toggleItem: (item) =>
        set((state) => {
          const exists = state.items.some((i) => i.id === item.id);
          return {
            items: exists
              ? state.items.filter((i) => i.id !== item.id)
              : [...state.items, item],
          };
        }),
      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
    }),
    { name: "wishlist-storage" }
  )
);

export function selectWishlistCount(state: WishlistState): number {
  return state.items.length;
}
