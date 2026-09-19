"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Flame, X, ArrowRight, Sparkles } from "lucide-react";

import { getEffectivePrice } from "@/lib/pricing";

interface LatestProduct {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  discount_percent?: number;
  category: string | null;
  created_at: string;
  image_url: string;
}

const STORAGE_KEY = "fhd_last_seen_product_id";

export function NewProductPopup() {
  const [product, setProduct] = useState<LatestProduct | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    async function checkForNewProducts() {
      try {
        const res = await fetch("/api/products/latest", { cache: "no-store" });
        if (!res.ok) return;

        const data = await res.json();
        const latest: LatestProduct | null = data.latestProduct;

        if (!latest || !latest.id) return;

        const lastSeenId = localStorage.getItem(STORAGE_KEY);

        // If user has not seen this latest product yet
        if (!lastSeenId || lastSeenId !== latest.id) {
          setProduct(latest);
          // Small delay before showing for pleasant mobile entrance
          const timer = setTimeout(() => {
            setIsVisible(true);
          }, 2000);
          return () => clearTimeout(timer);
        }
      } catch (err) {
        console.warn("Could not check for new products:", err);
      }
    }

    checkForNewProducts();

    // Re-check when user re-focuses or opens the app
    const handleFocus = () => {
      checkForNewProducts();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        checkForNewProducts();
      }
    });

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    if (product?.id) {
      localStorage.setItem(STORAGE_KEY, product.id);
    }
  };

  const handleProductClick = () => {
    if (product?.id) {
      localStorage.setItem(STORAGE_KEY, product.id);
    }
    setIsVisible(false);
  };

  if (!product || !isVisible) return null;

  const hasDiscount = (product.discount_percent || 0) > 0;
  const effectivePrice = getEffectivePrice(product.base_price, product.discount_percent);

  return (
    <div className="fixed top-16 left-3 right-3 sm:left-auto sm:right-6 sm:top-20 sm:max-w-md z-50 animate-in fade-in slide-in-from-top-6 duration-500">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-4 text-white shadow-2xl shadow-red-600/40 ring-2 ring-red-400/50">
        {/* Glowing Background Accents */}
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/15 blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 h-28 w-28 rounded-full bg-amber-400/20 blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss new product notification"
          className="absolute top-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/20 text-white/80 hover:bg-black/40 hover:text-white transition cursor-pointer"
        >
          <X size={14} />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-1.5 mb-2.5 pr-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300" />
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-200">
            <Flame size={13} className="text-amber-300 animate-bounce" /> {hasDiscount ? `Special Offer: -${product.discount_percent}% OFF!` : "New Product Added!"}
          </span>
        </div>

        {/* Product Content Card */}
        <div className="flex items-center gap-3 bg-black/20 backdrop-blur-sm rounded-xl p-2.5 border border-white/10">
          {/* Thumbnail */}
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white border border-white/20 shadow-sm">
            <Image
              src={product.image_url}
              alt={product.name}
              width={56}
              height={56}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate drop-shadow-sm">
              {product.name}
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
              <span className="text-xs font-extrabold text-amber-300">
                Rs. {effectivePrice.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-[10px] text-white/60 line-through">
                  Rs. {Number(product.base_price).toLocaleString()}
                </span>
              )}
              {product.category && (
                <span className="text-[10px] text-white/70 uppercase tracking-wider capitalize">
                  • {product.category.replace("-", " ")}
                </span>
              )}
            </div>
          </div>

          {/* Action Link */}
          <Link
            href={`/products/${product.slug}`}
            onClick={handleProductClick}
            className="shrink-0 flex items-center justify-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-black text-red-700 shadow-md hover:bg-red-50 active:scale-95 transition cursor-pointer"
          >
            <span>View</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
