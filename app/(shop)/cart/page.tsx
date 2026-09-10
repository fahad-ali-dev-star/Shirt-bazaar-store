"use client";

import { useCart } from "@/lib/store/cart";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2, ArrowRight, ShoppingBag, ArrowLeft, ShieldCheck, Truck, Tag, X, Check, Loader2 } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, setQty, subtotal, discountAmount, discountedTotal, appliedCoupon, applyCoupon, removeCoupon } = useCart();
  const router = useRouter();

  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    setCouponSuccess(null);

    try {
      const res = await fetch("/api/promos/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim() }),
      });

      const json = await res.json();

      if (!res.ok || !json.valid) {
        setCouponError(json.error || "Invalid or expired coupon code.");
      } else {
        applyCoupon({
          code: json.code,
          discountPercent: json.discountPercent,
          description: json.description,
        });
        setCouponSuccess(`✓ Coupon "${json.code}" applied! ${json.discountPercent}% discount added.`);
        setCouponInput("");
      }
    } catch {
      setCouponError("Could not validate coupon. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-32 text-center animate-fade-in">
        <div className="mx-auto w-28 h-28 bg-slate-100 rounded-3xl flex items-center justify-center mb-6 text-5xl">
          🛒
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Your cart is empty</h1>
        <p className="text-slate-500">Looks like you haven&apos;t added anything yet.</p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 btn-primary px-8 py-4 text-base"
        >
          <ArrowLeft size={18} />
          Start Shopping
        </Link>
      </main>
    );
  }

  const sub = subtotal();
  const discount = discountAmount();
  const finalTotal = discountedTotal();

  return (
    <main className="mx-auto max-w-5xl px-4 py-14 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Shopping Cart</h1>
          <p className="mt-1 text-sm text-slate-500">{items.length} item{items.length !== 1 ? "s" : ""} in your cart</p>
        </div>
        <Link href="/" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 transition-colors">
          <ArrowLeft size={14} /> Continue Shopping
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── Cart Items ── */}
        <div className="lg:col-span-8 space-y-3">
          {items.map((item) => (
            <div key={item.variantId} className="card card-hover p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5 group">
              {/* Image */}
              <div className="h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-50 border border-slate-100">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.productName}
                    width={112}
                    height={112}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-slate-200 select-none">
                    👕
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col sm:flex-row justify-between w-full gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {item.productName}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.size} · {item.color}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">Rs {item.price} <span className="text-slate-400 font-normal">each</span></p>
                </div>

                <div className="flex items-center gap-4 sm:justify-end">
                  {/* Quantity stepper */}
                  <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                    <button
                      onClick={() => setQty(item.variantId, Math.max(1, item.qty - 1))}
                      className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors font-bold text-lg"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={item.stockQty}
                      value={item.qty}
                      onChange={(e) => setQty(item.variantId, Number(e.target.value))}
                      className="w-10 bg-transparent text-center font-semibold text-sm border-0 focus:ring-0 p-0"
                    />
                    <button
                      onClick={() => setQty(item.variantId, Math.min(item.stockQty, item.qty + 1))}
                      className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors font-bold text-lg"
                    >
                      +
                    </button>
                  </div>

                  {/* Line subtotal */}
                  <p className="w-24 text-right font-bold text-slate-900 hidden sm:block">
                    Rs {(item.price * item.qty).toFixed(0)}
                  </p>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Remove item"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Order Summary ── */}
        <div className="lg:col-span-4">
          <div className="card p-6 sticky top-24 space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag size={16} className="text-brand-500" />
              Order Summary
            </h2>

            {/* Promo Code Input */}
            <div>
              {appliedCoupon ? (
                /* Applied Coupon Badge */
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Check size={15} className="text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-emerald-800 font-mono tracking-wider">
                        {appliedCoupon.code}
                      </span>
                      <p className="text-[11px] text-emerald-600">
                        {appliedCoupon.description || `${appliedCoupon.discountPercent}% Off Applied`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="p-1 rounded-lg text-emerald-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Remove coupon"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                /* Coupon Input Box */
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <Tag size={11} />
                    Have a promo code?
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        setCouponError(null);
                        setCouponSuccess(null);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                      placeholder="e.g. SAVE20"
                      className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono font-semibold uppercase text-slate-900 placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-200"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponInput.trim()}
                      className="shrink-0 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                    >
                      {couponLoading ? <Loader2 size={13} className="animate-spin" /> : null}
                      Apply
                    </button>
                  </div>
                  {couponError && (
                    <p className="mt-1.5 text-[11px] text-red-600 font-medium">{couponError}</p>
                  )}
                  {couponSuccess && (
                    <p className="mt-1.5 text-[11px] text-emerald-600 font-semibold">{couponSuccess}</p>
                  )}
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 text-sm text-slate-600 pb-4 border-b border-slate-100">
              {items.map((item) => (
                <div key={item.variantId} className="flex justify-between">
                  <span className="truncate mr-2 text-slate-500">
                    {item.productName} × {item.qty}
                  </span>
                  <span className="font-medium text-slate-900 shrink-0">
                    Rs {(item.price * item.qty).toFixed(0)}
                  </span>
                </div>
              ))}

              <div className="flex justify-between pt-2 border-t border-slate-100">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">Rs {sub.toFixed(2)}</span>
              </div>

              {/* Discount Line */}
              {discount > 0 && appliedCoupon && (
                <div className="flex justify-between text-emerald-600">
                  <span className="font-medium flex items-center gap-1">
                    <Tag size={12} />
                    Discount ({appliedCoupon.discountPercent}%)
                  </span>
                  <span className="font-bold">− Rs {discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-medium text-slate-400 text-xs">Calc. at checkout</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900">Total</span>
              <div className="text-right">
                {discount > 0 && (
                  <p className="text-xs line-through text-slate-400 font-medium">Rs {sub.toFixed(2)}</p>
                )}
                <span className="text-2xl font-extrabold text-brand-600">Rs {finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => router.push("/checkout")}
              className="btn-primary w-full py-4 text-sm rounded-xl"
            >
              Proceed to Checkout
              <ArrowRight size={16} />
            </button>

            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><ShieldCheck size={12} /> Secure</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Truck size={12} /> Fast Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
