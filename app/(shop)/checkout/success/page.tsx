"use client";

import { Suspense, useEffect } from "react";
import { useCart } from "@/lib/store/cart";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
  const clear = useCart((s) => s.clear);
  const params = useSearchParams();
  const orderId = params.get("order");
  const method = params.get("method");
  const tid = params.get("tid");

  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <>
      <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl sm:text-4xl mb-4 sm:mb-6 shadow-sm">
        🎉
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Order Placed Successfully!</h1>
      <p className="mt-2 sm:mt-3 text-sm sm:text-base text-slate-600">
        Thanks for your order{orderId ? ` (#${orderId.slice(0, 8).toUpperCase()})` : ""}. {"We'll send updates as it's processed."}
      </p>

      {method === "cod" && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5 text-left text-xs sm:text-sm text-amber-900 shadow-2xs">
          <p className="font-semibold flex items-center gap-2 text-sm sm:text-base">
            <span>💵 Payment Method: Cash on Delivery (COD)</span>
          </p>
          <p className="mt-1 text-amber-800 leading-relaxed">
            Your order is confirmed and being prepared. Please ensure you have the cash amount ready when the courier arrives at your shipping address.
          </p>
        </div>
      )}

      {method === "jazzcash" && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5 text-left text-xs sm:text-sm text-red-950 shadow-2xs">
          <p className="font-semibold flex items-center gap-2 text-sm sm:text-base">
            <span>📱 Payment Method: JazzCash (Direct Transfer)</span>
          </p>
          {tid && (
            <p className="mt-1.5 font-mono text-xs font-bold text-red-800 bg-red-100/70 inline-block px-2.5 py-1 rounded-lg">
              Submitted TID: {tid}
            </p>
          )}
          <p className="mt-2 text-xs text-red-800 leading-relaxed">
            We have received your payment Transaction ID. Our team will verify the transfer in our JazzCash merchant ledger and proceed with packaging your items.
          </p>
        </div>
      )}

      {method === "easypaisa" && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5 text-left text-xs sm:text-sm text-emerald-950 shadow-2xs">
          <p className="font-semibold flex items-center gap-2 text-sm sm:text-base">
            <span>🟢 Payment Method: Easypaisa (Direct Transfer)</span>
          </p>
          {tid && (
            <p className="mt-1.5 font-mono text-xs font-bold text-emerald-800 bg-emerald-100/70 inline-block px-2.5 py-1 rounded-lg">
              Submitted TID: {tid}
            </p>
          )}
          <p className="mt-2 text-xs text-emerald-800 leading-relaxed">
            We have received your payment Transaction ID. Our team will verify the transfer in our Easypaisa merchant ledger and proceed with packaging your items.
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link href="/account" className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs text-center">
          View My Orders
        </Link>
        <Link href="/" className="w-full sm:w-auto rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition shadow-xs text-center">
          Continue Shopping
        </Link>
      </div>
    </>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-12 sm:py-20 text-center animate-fade-in">
      <Suspense fallback={<p className="text-slate-500 text-sm">Loading order details…</p>}>
        <SuccessContent />
      </Suspense>
    </main>
  );
}
