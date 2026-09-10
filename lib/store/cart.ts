"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  variantId: string;
  productName: string;
  size: string;
  color: string;
  price: number;
  qty: number;
  image?: string;
  stockQty: number; // snapshot at time of adding, used for UI limits only
};

export type AppliedCoupon = {
  code: string;
  discountPercent: number;
  description?: string;
};

type CartState = {
  items: CartItem[];
  appliedCoupon: AppliedCoupon | null;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  setQty: (variantId: string, qty: number) => void;
  clear: () => void;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
  subtotal: () => number;
  discountAmount: () => number;
  discountedTotal: () => number;
  total: () => number;
  count: () => number;
};

// Cart lives in client state + localStorage. We deliberately never hit
// Supabase on add/remove/qty-change — that's how stores buckle under load.
// The cart only touches the server once, at checkout.
export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, qty: Math.min(i.qty + item.qty, i.stockQty) }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),

      setQty: (variantId, qty) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId
              ? { ...i, qty: Math.max(1, Math.min(qty, i.stockQty)) }
              : i
          ),
        })),

      clear: () => set({ items: [], appliedCoupon: null }),

      applyCoupon: (coupon) =>
        set({
          appliedCoupon: {
            code: coupon.code.toUpperCase().trim(),
            discountPercent: Math.max(1, Math.min(coupon.discountPercent, 100)),
            description: coupon.description,
          },
        }),

      removeCoupon: () => set({ appliedCoupon: null }),

      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),

      discountAmount: () => {
        const sub = get().subtotal();
        const coupon = get().appliedCoupon;
        if (!coupon || !coupon.discountPercent || sub <= 0) return 0;
        return (sub * coupon.discountPercent) / 100;
      },

      discountedTotal: () => {
        const sub = get().subtotal();
        const discount = get().discountAmount();
        return Math.max(0, sub - discount);
      },

      total: () => get().discountedTotal(),
      count: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    { name: "shirt-store-cart" }
  )
);
