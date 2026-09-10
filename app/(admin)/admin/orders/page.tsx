"use client";

import { useEffect, useState } from "react";
import type { AdminOrder, OrderItemWithProduct } from "@/lib/supabase/types";

const STATUSES = ["pending", "processing", "shipped", "fulfilled", "cancelled"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 401 ? "Not authorized" : "Failed to load");
        return res.json();
      })
      .then((data) => setOrders(data.orders))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function updatePaymentStatus(orderId: string, payment_status: AdminOrder["payment_status"]) {
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, payment_status }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      window.alert(data?.error ?? "Failed to update payment status");
      return;
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, payment_status } : o))
    );
  }

  async function updateStatus(orderId: string, status: AdminOrder["status"]) {
    let courier: string | null = null;
    let tracking_number: string | null = null;

    if (status === "shipped") {
      courier = window.prompt("Enter the Courier Name (e.g. TCS, Leopard, Trax):");
      if (courier === null) return; // User cancelled
      tracking_number = window.prompt("Enter the Tracking Number:");
      if (tracking_number === null) return; // User cancelled
    }

    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status, courier, tracking_number }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      window.alert(data?.error ?? "Failed to update order");
      return;
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              payment_status:
                status === "fulfilled" && o.payment_method === "cod" ? "paid" : o.payment_status,
              courier: status === "shipped" ? courier : o.courier,
              tracking_number: status === "shipped" ? tracking_number : o.tracking_number,
            }
          : o
      )
    );
  }

  if (loading) return <main className="mx-auto max-w-5xl px-4 py-10">Loading…</main>;
  if (error)
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-red-600">{error}</p>
      </main>
    );

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Orders</h1>

      {orders.length === 0 && <p className="text-gray-600">No orders yet.</p>}

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="rounded-lg border p-4 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Payment Method Badge */}
                <span
                  className={`rounded px-2.5 py-0.5 text-xs font-semibold uppercase border ${
                    order.payment_method === "cod"
                      ? "bg-amber-100 text-amber-800 border-amber-200"
                      : order.payment_method === "jazzcash"
                      ? "bg-red-100 text-red-800 border-red-200"
                      : order.payment_method === "easypaisa"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : "bg-blue-100 text-blue-800 border-blue-200"
                  }`}
                >
                  {order.payment_method === "cod"
                    ? "💵 COD"
                    : order.payment_method === "jazzcash"
                    ? "📱 JazzCash"
                    : order.payment_method === "easypaisa"
                    ? "🟢 Easypaisa"
                    : "💳 Stripe"}
                </span>

                {/* Payment Status with quick toggle */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs">
                  <span className="text-slate-500">Payment:</span>
                  <span
                    className={`font-bold capitalize ${
                      order.payment_status === "paid" ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {order.payment_status}
                  </span>
                  <button
                    onClick={() =>
                      updatePaymentStatus(
                        order.id,
                        order.payment_status === "paid" ? "unpaid" : "paid"
                      )
                    }
                    className="ml-1 text-[10px] text-blue-600 hover:text-blue-800 underline font-medium"
                    title="Click to toggle payment verification status"
                  >
                    {order.payment_status === "paid" ? "Mark Unpaid" : "Mark as Paid"}
                  </button>
                </div>

                {/* Order Status Selector */}
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value as AdminOrder["status"])}
                  className="rounded border px-2 py-1 text-sm bg-white"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Reference / TID Details */}
            {order.payment_reference && (
              <div className="mt-2.5 rounded bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-800 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-semibold text-slate-600">Payment Ref / TID:</span>{" "}
                  <span className="font-mono font-bold text-slate-900">{order.payment_reference}</span>
                </div>
                {order.payment_status !== "paid" && (order.payment_method === "jazzcash" || order.payment_method === "easypaisa") && (
                  <button
                    onClick={() => updatePaymentStatus(order.id, "paid")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded text-[11px] font-semibold transition-colors"
                  >
                    ✓ Confirm TID & Mark Paid
                  </button>
                )}
              </div>
            )}

            <div className="mt-3 divide-y border-t text-sm">
              {order.order_items?.map((item: OrderItemWithProduct, i: number) => (
                <div key={i} className="flex justify-between py-2">
                  <span>
                    {item.product_variants?.products?.name} — {item.product_variants?.size}/
                    {item.product_variants?.color} × {item.qty}
                  </span>
                  <span>Rs {item.price_at_purchase * item.qty}</span>
                </div>
              ))}
            </div>

            <div className="mt-2 flex justify-between border-t pt-2 text-sm font-medium">
              <span>
                Ship to: {order.shipping_address?.fullName}, {order.shipping_address?.city} ({order.shipping_address?.phone})
              </span>
              <span>Total: Rs {order.total}</span>
            </div>
            
            {order.courier && order.tracking_number && (
              <div className="mt-2 rounded bg-blue-50 p-2 text-xs text-blue-800 border border-blue-100">
                <p><strong>Courier:</strong> {order.courier}</p>
                <p><strong>Tracking:</strong> {order.tracking_number}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
