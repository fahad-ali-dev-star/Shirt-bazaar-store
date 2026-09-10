"use client";

import { useState } from "react";
import { useCart } from "@/lib/store/cart";
import { useRouter } from "next/navigation";
import { ShoppingBag, Sparkles, Check, ArrowRight } from "lucide-react";
import { SizeAdvisorModal } from "./size-advisor-modal";

type Variant = {
  id: string;
  size: string;
  color: string;
  stock_qty: number;
  price_override: number | null;
};

export function AddToCartForm({
  productName,
  basePrice,
  variants,
  image,
}: {
  productName: string;
  basePrice: number;
  variants: Variant[];
  image?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    variants.find((v) => v.stock_qty > 0)?.id ?? null
  );
  const [added, setAdded] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const addItem = useCart((s) => s.addItem);
  const router = useRouter();

  const selected = variants.find((v) => v.id === selectedId);
  const availableSizes = Array.from(new Set(variants.map((v) => v.size)));

  function handleSelectRecommendedSize(size: string) {
    const match =
      variants.find((v) => v.size.toLowerCase() === size.toLowerCase() && v.stock_qty > 0) ||
      variants.find((v) => v.size.toLowerCase() === size.toLowerCase());
    if (match) setSelectedId(match.id);
  }

  function handleAdd() {
    if (!selected) return;
    addItem({
      variantId: selected.id,
      productName,
      size: selected.size,
      color: selected.color,
      price: selected.price_override ?? basePrice,
      qty: 1,
      image,
      stockQty: selected.stock_qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div>
      {/* Variant selector header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-900">Select Variant</span>
        <button
          type="button"
          onClick={() => setAdvisorOpen(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-full transition-colors"
        >
          <Sparkles size={12} />
          AI Size Finder
        </button>
      </div>

      {/* Variant pills */}
      <div className="flex flex-wrap gap-2.5 mb-2">
        {variants.map((v) => {
          const isSelected = selectedId === v.id;
          const isOOS = v.stock_qty === 0;
          const isLow = v.stock_qty > 0 && v.stock_qty <= 5;

          return (
            <button
              key={v.id}
              type="button"
              disabled={isOOS}
              onClick={() => setSelectedId(v.id)}
              className={`relative px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                isOOS
                  ? "border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50 line-through"
                  : isSelected
                  ? "border-brand-600 bg-brand-600 text-white shadow-brand"
                  : "border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50"
              }`}
            >
              {v.size} / {v.color}
              {isLow && !isOOS && (
                <span className="absolute -top-1.5 -right-1.5 px-1 py-px rounded-full text-[9px] font-bold bg-amber-400 text-amber-900">
                  Low
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Stock info */}
      {selected && (
        <p className={`text-xs mt-2 mb-5 font-medium ${selected.stock_qty <= 5 ? "text-amber-600" : "text-emerald-600"}`}>
          {selected.stock_qty <= 5
            ? `⚠ Only ${selected.stock_qty} left in stock`
            : `✓ ${selected.stock_qty} in stock`}
        </p>
      )}

      {/* CTA buttons */}
      <div className="space-y-2.5 pt-2">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!selected}
          className={`group flex w-full items-center justify-center gap-2.5 rounded-xl px-8 py-4 text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            added
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
              : "bg-slate-950 text-white hover:bg-brand-600 hover:shadow-brand-lg"
          }`}
        >
          {added ? (
            <>
              <Check size={18} className="animate-bounce-in" />
              Added to Cart!
            </>
          ) : (
            <>
              <ShoppingBag size={18} />
              Add to Cart
            </>
          )}
        </button>

        {added && (
          <button
            type="button"
            onClick={() => router.push("/cart")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 px-8 py-3.5 text-sm font-semibold text-slate-700 transition-all hover:border-brand-500 hover:text-brand-600 animate-slide-up"
          >
            View Cart <ArrowRight size={15} />
          </button>
        )}
      </div>

      <SizeAdvisorModal
        isOpen={advisorOpen}
        onClose={() => setAdvisorOpen(false)}
        productName={productName}
        availableSizes={availableSizes}
        onSelectSize={handleSelectRecommendedSize}
      />
    </div>
  );
}
