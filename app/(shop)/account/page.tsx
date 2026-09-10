import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "./sign-out-button";
import type { CustomerOrder, OrderItemWithProduct } from "@/lib/supabase/types";
import { Package, Truck, CheckCircle, Clock, XCircle, ExternalLink } from "lucide-react";
import { getCourierTrackingUrl } from "@/lib/tracking";

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  fulfilled:  { label: "Fulfilled",  color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200",  icon: <CheckCircle size={13} /> },
  paid:       { label: "Paid",       color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200",  icon: <CheckCircle size={13} /> },
  processing: { label: "Processing", color: "text-blue-700",    bg: "bg-blue-50 border-blue-200",        icon: <Clock size={13} /> },
  shipped:    { label: "Shipped",    color: "text-indigo-700",  bg: "bg-indigo-50 border-indigo-200",    icon: <Truck size={13} /> },
  cancelled:  { label: "Cancelled",  color: "text-red-700",     bg: "bg-red-50 border-red-200",          icon: <XCircle size={13} /> },
  refunded:   { label: "Refunded",   color: "text-red-700",     bg: "bg-red-50 border-red-200",          icon: <XCircle size={13} /> },
  pending:    { label: "Pending",    color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",      icon: <Clock size={13} /> },
};

function statusMeta(status: string) {
  return STATUS_META[status] ?? STATUS_META.pending;
}

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, status, total, payment_status, payment_method, created_at, courier, tracking_number, shipped_at, order_items(qty, price_at_purchase, product_variants(size, color, products(name)))"
    )
    .order("created_at", { ascending: false });

  const initials = user.email
    ? user.email.slice(0, 2).toUpperCase()
    : "US";

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 animate-fade-in">
      {/* ── Profile Header ── */}
      <div className="card p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-xl font-bold text-white shadow-brand">
            {initials}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-lg">My Account</p>
            <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>
          </div>
        </div>
        <SignOutButton />
      </div>

      {/* ── Orders ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package size={18} className="text-brand-500" />
            My Orders
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Track and manage your recent purchases</p>
        </div>
        {orders && orders.length > 0 && (
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {orders.length} order{orders.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Empty state */}
      {!orders || orders.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">📦</div>
          <p className="font-semibold text-slate-700 mb-1">No orders yet</p>
          <p className="text-sm text-slate-400 mb-6">Your order history will appear here once you make a purchase.</p>
          <Link
            href="/"
            className="btn-primary text-sm px-6 py-3"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {(orders as CustomerOrder[]).map((order) => {
            const sm = statusMeta(order.status);
            const pm = statusMeta(order.payment_status);

            return (
              <div key={order.id} className="card overflow-hidden card-hover">
                {/* Order header */}
                <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 bg-slate-50 border-b border-slate-100">
                  {/* Left: ID + date */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Order</p>
                    <p className="font-mono text-sm font-bold text-slate-900">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString("en-PK", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Right: amount + badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-slate-900">
                      Rs {Number(order.total).toLocaleString()}
                    </span>

                    {/* Payment method */}
                    <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                      order.payment_method === "cod"
                        ? "bg-amber-50 border-amber-200 text-amber-800"
                        : order.payment_method === "jazzcash"
                        ? "bg-red-50 border-red-200 text-red-800"
                        : order.payment_method === "easypaisa"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-blue-50 border-blue-200 text-blue-800"
                    }`}>
                      {order.payment_method === "cod"
                        ? "💵 COD"
                        : order.payment_method === "jazzcash"
                        ? "📱 JazzCash"
                        : order.payment_method === "easypaisa"
                        ? "🟢 Easypaisa"
                        : "💳 Card"}
                    </span>

                    {/* Order status */}
                    <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${sm.bg} ${sm.color}`}>
                      {sm.icon} {sm.label}
                    </span>

                    {/* Payment status */}
                    <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${pm.bg} ${pm.color}`}>
                      {pm.icon} {pm.label}
                    </span>
                  </div>
                </div>

                {/* Tracking info */}
                {order.courier && order.tracking_number && (
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50/70 border-b border-indigo-100 px-5 py-3">
                    <div className="flex items-start gap-3">
                      <Truck size={16} className="mt-0.5 text-indigo-600 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-indigo-900">
                          Shipped via {order.courier}
                        </p>
                        <p className="text-xs text-indigo-700 mt-0.5">
                          Tracking ID: <span className="font-mono font-bold">{order.tracking_number}</span>
                        </p>
                      </div>
                    </div>
                    {getCourierTrackingUrl(order.courier, order.tracking_number) && (
                      <a
                        href={getCourierTrackingUrl(order.courier, order.tracking_number)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        <span>Track Package</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                )}

                {/* Items */}
                <ul className="divide-y divide-slate-50">
                  {order.order_items?.map((item: OrderItemWithProduct, idx: number) => {
                    const variant = item.product_variants;
                    const productName = variant?.products?.name ?? "Unknown product";
                    return (
                      <li key={idx} className="flex items-center justify-between px-5 py-3.5 gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-base shrink-0">
                            👕
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-slate-900 truncate">{productName}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {variant?.size} · {variant?.color} · Qty {item.qty}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-sm text-slate-800 shrink-0">
                          Rs {Number(item.price_at_purchase * item.qty).toLocaleString()}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
