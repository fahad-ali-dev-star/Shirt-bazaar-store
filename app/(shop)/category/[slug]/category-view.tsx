"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { SlidersHorizontal, ArrowUpDown, Sparkles, ShoppingBag } from "lucide-react";
import { WishlistButton } from "@/components/wishlist-button";
import { getEffectivePrice } from "@/lib/pricing";
import type { HomeProductItem } from "@/lib/supabase/cached-queries";

export function CategoryView({
  products,
  categoryTitle,
}: {
  products: HomeProductItem[];
  categoryTitle: string;
}) {
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc">("featured");
  const [priceFilter, setPriceFilter] = useState<"all" | "under2500" | "2500to3500" | "above3500">("all");

  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Filter by effective selling price range
    if (priceFilter === "under2500") {
      list = list.filter((p) => getEffectivePrice(p.base_price, p.discount_percent) < 2500);
    } else if (priceFilter === "2500to3500") {
      list = list.filter((p) => {
        const price = getEffectivePrice(p.base_price, p.discount_percent);
        return price >= 2500 && price <= 3500;
      });
    } else if (priceFilter === "above3500") {
      list = list.filter((p) => getEffectivePrice(p.base_price, p.discount_percent) > 3500);
    }

    // Sort
    if (sortBy === "price-asc") {
      list.sort((a, b) => getEffectivePrice(a.base_price, a.discount_percent) - getEffectivePrice(b.base_price, b.discount_percent));
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => getEffectivePrice(b.base_price, b.discount_percent) - getEffectivePrice(a.base_price, a.discount_percent));
    }

    return list;
  }, [products, sortBy, priceFilter]);

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
        {/* Price Range Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 mr-1 hidden sm:inline flex items-center gap-1">
            <SlidersHorizontal size={12} /> Price:
          </span>
          {[
            { id: "all", label: "All Prices" },
            { id: "under2500", label: "Under Rs 2,500" },
            { id: "2500to3500", label: "Rs 2,500 – 3,500" },
            { id: "above3500", label: "Rs 3,500+" },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setPriceFilter(pill.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                priceFilter === pill.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <ArrowUpDown size={13} className="text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-slate-400 cursor-pointer"
          >
            <option value="featured">Featured / Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-semibold text-slate-700 text-sm">No products match your selected filters</p>
          <button
            onClick={() => {
              setPriceFilter("all");
              setSortBy("featured");
            }}
            className="mt-3 text-xs font-semibold text-brand-600 underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {filteredProducts.map((p, idx) => {
            const images = Array.isArray(p.product_images) ? p.product_images : [];
            const cover = images.reduce<{ url: string; position: number } | null>(
              (best, image) => (!best || image.position < best.position ? image : best),
              null
            );
            const hasDiscount = (p.discount_percent || 0) > 0;
            const effectivePrice = getEffectivePrice(p.base_price, p.discount_percent);

            return (
              <div
                key={p.id}
                className="group flex flex-col animate-slide-up card-hover rounded-xl sm:rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-xs relative"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* Badges (Top Left) */}
                {hasDiscount && (
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black tracking-wider bg-red-600 text-white shadow-xs">
                      -{p.discount_percent}% OFF
                    </span>
                  </div>
                )}

                <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10">
                  <WishlistButton
                    item={{
                      productId: p.id,
                      name: p.name,
                      slug: p.slug,
                      basePrice: p.base_price,
                      discountPercent: p.discount_percent || 0,
                      image: cover?.url,
                      category: p.category || categoryTitle,
                    }}
                    size={15}
                  />
                </div>

                {/* Image Link */}
                <Link href={`/products/${p.slug}`} className="relative aspect-[4/5] overflow-hidden bg-slate-100">
                  {cover ? (
                    <Image
                      src={cover.url}
                      alt={p.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl sm:text-5xl text-slate-200 select-none">
                      👕
                    </div>
                  )}

                  {/* Hover overlay (desktop only) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block" />
                  <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hidden sm:block">
                    <div className="w-full bg-white/95 backdrop-blur-sm text-center py-2.5 rounded-xl text-xs font-semibold text-slate-900 shadow-sm">
                      View Details →
                    </div>
                  </div>
                </Link>

                {/* Info */}
                <div className="p-2.5 sm:p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2">
                  <div className="min-w-0 w-full sm:w-auto">
                    <Link href={`/products/${p.slug}`}>
                      <h3 className="font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                        {p.name}
                      </h3>
                    </Link>
                    <p className="mt-0.5 text-[11px] sm:text-xs text-slate-400 capitalize">{categoryTitle}</p>
                  </div>

                  {hasDiscount ? (
                    <div className="flex flex-col items-end shrink-0 self-end sm:self-auto">
                      <p className="font-extrabold text-xs sm:text-sm text-red-600">
                        Rs {effectivePrice.toLocaleString()}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-400 line-through">
                        Rs {Number(p.base_price).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <p className="font-bold text-xs sm:text-sm text-slate-900 shrink-0 self-end sm:self-auto">
                      Rs {Number(p.base_price).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
