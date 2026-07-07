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
  chargeShipping: boolean;
  taxable: boolean;
  taxOverridePercent: number | null;
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
    {
      name: "wishlist-storage",
      // Same reasoning as lib/cartStore.ts's migration: a wishlist saved
      // before chargeShipping/taxable/taxOverridePercent existed has items
      // missing those fields, which would read as `undefined` (falsy) and
      // misrepresent an old saved item as shipping-exempt/non-taxable once
      // it's added to cart from here. Backfill the same safe defaults.
      version: 1,
      migrate: (persisted) => {
        const state = persisted as { items?: Partial<WishlistItem>[] };
        const items: WishlistItem[] = (state.items ?? []).map((item) => ({
          id: item.id!,
          name: item.name!,
          pack: item.pack ?? null,
          price: item.price!,
          compareAtPrice: item.compareAtPrice ?? null,
          isOnSale: item.isOnSale ?? false,
          inStock: item.inStock ?? true,
          image: item.image ?? null,
          chargeShipping: item.chargeShipping ?? true,
          taxable: item.taxable ?? true,
          taxOverridePercent: item.taxOverridePercent ?? null,
        }));
        return { ...state, items };
      },
    }
  )
);

export function selectWishlistCount(state: WishlistState): number {
  return state.items.length;
}
