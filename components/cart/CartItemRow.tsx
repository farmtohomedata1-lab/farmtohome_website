"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { CartItem } from "@/lib/cartStore";

export default function CartItemRow({
  item,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-4 border-b border-gray-100 p-4 last:border-0 sm:flex-row sm:items-center sm:gap-3"
    >
      <div className="flex flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${item.name}`}
          className="shrink-0 text-gray-400 hover:text-sale-red"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        {item.image && (
          <Image
            src={item.image}
            alt={item.name}
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 rounded object-cover"
          />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-dark-green">{item.name}</p>
          {item.pack && <p className="text-xs text-gray-400">{item.pack}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:w-auto sm:justify-end sm:gap-8">
        <div className="text-sm text-gray-700 sm:w-16">
          <span className="text-xs uppercase text-gray-400 sm:hidden">Price </span>
          {formatPrice(item.price)}
        </div>

        <div className="flex items-center rounded-md border border-gray-300">
          <button
            type="button"
            onClick={() => onQuantityChange(Math.max(1, item.quantity - 1))}
            className="px-2.5 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            value={item.quantity}
            onChange={(e) => onQuantityChange(Math.max(1, Number(e.target.value) || 1))}
            className="w-12 border-x border-gray-300 py-1.5 text-center text-sm text-gray-900 focus:outline-none [appearance:textfield]"
          />
          <button
            type="button"
            onClick={() => onQuantityChange(item.quantity + 1)}
            className="px-2.5 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <div className="text-sm font-semibold text-dark-green sm:w-20 sm:text-right">
          <span className="text-xs font-normal uppercase text-gray-400 sm:hidden">Subtotal </span>
          {formatPrice(item.price * item.quantity)}
        </div>
      </div>
    </motion.div>
  );
}
