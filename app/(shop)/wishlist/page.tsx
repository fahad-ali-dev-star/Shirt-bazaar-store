"use client";

import { useWishlist } from "@/lib/store/wishlist";
import Image from "next/image";
import Link from "next/link";
import { Heart, Trash2, ArrowRight, ArrowLeft, ShoppingBag, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { getEffectivePrice } from "@/lib/pricing";

export default function WishlistPage() {
  const { items, removeItem, clear } = useWishlist();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16 text-center">
        <div className="text-slate-400 text-sm animate-pulse">Loading wishlist…</div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 sm:py-32 text-center animate-fade-in">
        <div className="mx-auto w-24 h-24 bg-rose-50 text-rose-400 rounded-3xl flex items-center justify-center mb-6 text-4xl shadow-xs">
          <Heart size={44} className="stroke-[1.5]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2">
          Your Wishlist is Empty
        </h1>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mb-8">
          Save items you love by tapping the heart icon on any product, so you can easily find them later.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 btn-primary px-7 py-3.5 text-sm"
        >
          <ArrowLeft size={16} />
          <span>Explore Collections</span>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-14 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Heart size={26} className="text-rose-500 fill-rose-500" />
            My Wishlist
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {items.length} saved item{items.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={clear}
            className="text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors"
          >
            Clear Wishlist
          </button>
          <Link
            href="/"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            Continue Shopping →
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item) => {
            const hasDiscount = (item.discountPercent || 0) > 0;
            const effectivePrice = getEffectivePrice(item.basePrice, item.discountPercent);

            return (
          <div
            key={item.productId}
            className="group flex flex-col rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-xs card-hover relative"
          >
            {/* Remove button */}
            <button
              onClick={() => removeItem(item.productId)}
              title="Remove from wishlist"
              className="absolute top-2.5 right-2.5 z-10 p-2 rounded-full bg-white/90 backdrop-blur-xs text-slate-400 hover:text-red-500 hover:bg-white shadow-xs transition-colors"
            >
              <Trash2 size={15} />
            </button>

            {/* Discount badge */}
            {hasDiscount && (
              <div className="absolute top-2.5 left-2.5 z-10">
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white shadow-sm tracking-tight">
                  <Zap size={9} className="fill-white" />
                  -{item.discountPercent}% OFF
                </span>
              </div>
            )}

            {/* Image Link */}
            <Link href={`/products/${item.slug}`} className="relative aspect-[4/5] overflow-hidden bg-slate-100">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-slate-200">
                  👕
                </div>
              )}
            </Link>

            {/* Content */}
            <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1">
              <div>
                <Link href={`/products/${item.slug}`}>
                  <h2 className="font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                    {item.name}
                  </h2>
                </Link>
                <p className="mt-0.5 text-[11px] text-slate-400 capitalize">
                  {item.category ? item.category.replace(/-/g, " ") : "Premium Cotton"}
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="font-bold text-xs sm:text-sm text-slate-900">
                    Rs {effectivePrice.toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <span className="text-[11px] text-slate-400 line-through">
                      Rs {Number(item.basePrice).toLocaleString()}
                    </span>
                  )}
                </div>
                <Link
                  href={`/products/${item.slug}`}
                  className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 transition-colors shadow-2xs"
                >
                  <ShoppingBag size={12} />
                  <span>View</span>
                </Link>
              </div>
            </div>
          </div>
            );
          })}
      </div>
    </main>
  );
}
