"use client";

import Link from "next/link";
import { useWishlistStore } from "@/lib/wishlistStore";
import ShopProductCard from "@/components/shop/ShopProductCard";

export default function WishlistClient() {
  const items = useWishlistStore((state) => state.items);

  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[1320px] px-4 py-16 text-center sm:px-6">
        <p className="text-lg font-semibold text-dark-green">Your wishlist is empty</p>
        <p className="mt-2 text-sm text-gray-500">
          Tap the heart icon on any product to save it here.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-md bg-brand-green px-6 py-3 text-sm font-semibold text-white"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <ShopProductCard key={item.id} product={item} />
        ))}
      </div>
    </div>
  );
}
