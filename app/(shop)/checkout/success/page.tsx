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
      <h1 className="text-2xl font-semibold">Order placed 🎉</h1>
      <p className="mt-3 text-gray-600">
        Thanks for your order{orderId ? ` (#${orderId.slice(0, 8)})` : ""}. {"We'll send updates as it's processed."}
      </p>

      {method === "cod" && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-left text-sm text-amber-900">
          <p className="font-semibold flex items-center gap-2">
            <span>💵 Payment Method: Cash on Delivery (COD)</span>
          </p>
          <p className="mt-1 text-amber-800">
            Your order is confirmed and being prepared. Please ensure you have the cash amount ready when the courier arrives at your shipping address.
          </p>
        </div>
      )}

      {method === "jazzcash" && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-left text-sm text-red-950">
          <p className="font-semibold flex items-center gap-2">
            <span>📱 Payment Method: JazzCash (Direct Transfer)</span>
          </p>
          {tid && (
            <p className="mt-1 font-mono text-xs font-bold text-red-800 bg-red-100/70 inline-block px-2 py-0.5 rounded">
              Submitted TID: {tid}
            </p>
          )}
          <p className="mt-2 text-xs text-red-800 leading-relaxed">
            We have received your payment Transaction ID. Our team will verify the transfer in our JazzCash merchant ledger and proceed with packaging your items.
          </p>
        </div>
      )}

      {method === "easypaisa" && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-left text-sm text-emerald-950">
          <p className="font-semibold flex items-center gap-2">
            <span>🟢 Payment Method: Easypaisa (Direct Transfer)</span>
          </p>
          {tid && (
            <p className="mt-1 font-mono text-xs font-bold text-emerald-800 bg-emerald-100/70 inline-block px-2 py-0.5 rounded">
              Submitted TID: {tid}
            </p>
          )}
          <p className="mt-2 text-xs text-emerald-800 leading-relaxed">
            We have received your payment Transaction ID. Our team will verify the transfer in our Easypaisa merchant ledger and proceed with packaging your items.
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link href="/account" className="w-full sm:w-auto rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium hover:bg-gray-50">
          View my orders
        </Link>
        <Link href="/" className="w-full sm:w-auto rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800">
          Continue shopping
        </Link>
      </div>
    </>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-20 text-center">
      <Suspense fallback={<p className="text-gray-600">Loading…</p>}>
        <SuccessContent />
      </Suspense>
    </main>
  );
}
