"use client";

import { useWishlist, type WishlistItem } from "@/lib/store/wishlist";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

export function WishlistButton({
  item,
  className = "",
  size = 18,
}: {
  item: WishlistItem;
  className?: string;
  size?: number;
}) {
  const { toggleItem, hasItem } = useWishlist();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const active = mounted ? hasItem(item.productId) : false;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleItem(item);
      }}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      className={`p-2 rounded-full transition-all duration-200 active:scale-90 ${
        active
          ? "bg-rose-50 text-rose-600 hover:bg-rose-100 shadow-xs"
          : "bg-white/80 backdrop-blur-xs text-slate-400 hover:text-rose-500 hover:bg-white shadow-xs"
      } ${className}`}
    >
      <Heart
        size={size}
        className={`transition-colors ${
          active ? "fill-rose-500 text-rose-500 stroke-[2.5]" : "stroke-[2]"
        }`}
      />
    </button>
  );
}
