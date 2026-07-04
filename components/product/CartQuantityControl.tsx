"use client";

import { motion } from "framer-motion";
import { useCartQuantity, useCartStore } from "@/lib/cartStore";
import { IconCart } from "@/components/home/icons";

export interface CartQuantityControlProduct {
  id: string;
  name: string;
  price: number;
  image: string | null;
  pack: string | null;
  inStock: boolean;
}

const VARIANT_CLASSES = {
  card: {
    addButton:
      "flex w-full items-center justify-center gap-1.5 rounded-md bg-brand-green py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50",
    stepper: "flex w-full items-center justify-between rounded-md border border-gray-300",
    stepperButton: "px-2.5 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-50",
    qty: "flex-1 text-center text-sm font-semibold text-dark-green",
  },
  detail: {
    addButton:
      "flex flex-1 items-center justify-center gap-2 rounded-md bg-brand-green px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none",
    stepper: "flex items-center rounded-md border border-gray-300",
    stepperButton: "px-3 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50",
    qty: "w-14 text-center text-sm font-semibold text-dark-green",
  },
} as const;

// Reads/writes the real cart store directly — the "Add to Cart" button and
// the −/qty/+ stepper are two faces of the exact same live quantity, never a
// local counter. Quantity 0 shows the button; 1+ shows the stepper; there is
// no separate "just added" flag, so this can never drift from /cart.
export default function CartQuantityControl({
  product,
  variant = "card",
  addLabel = "Add To Cart",
  showCartIcon = false,
}: {
  product: CartQuantityControlProduct;
  variant?: "card" | "detail";
  addLabel?: string;
  showCartIcon?: boolean;
}) {
  const quantity = useCartQuantity(product.id);
  const addItem = useCartStore((state) => state.addItem);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const classes = VARIANT_CLASSES[variant];

  function handleAdd() {
    addItem(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        pack: product.pack,
      },
      1
    );
  }

  if (quantity === 0) {
    return (
      <motion.button
        type="button"
        onClick={handleAdd}
        disabled={!product.inStock}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.18 }}
        className={classes.addButton}
      >
        {product.inStock ? addLabel : "Out of Stock"}
        {showCartIcon && product.inStock && <IconCart className="h-3.5 w-3.5" />}
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.18 }}
      className={classes.stepper}
    >
      <button
        type="button"
        onClick={() => setQuantity(product.id, quantity - 1)}
        className={classes.stepperButton}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <motion.span
        key={quantity}
        initial={{ scale: 1.25 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.18 }}
        className={classes.qty}
      >
        {quantity}
      </motion.span>
      <button
        type="button"
        onClick={() => setQuantity(product.id, quantity + 1)}
        className={classes.stepperButton}
        aria-label="Increase quantity"
      >
        +
      </button>
    </motion.div>
  );
}
