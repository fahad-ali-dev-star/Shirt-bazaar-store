"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Package,
  CheckCircle2,
  Truck,
  CreditCard,
  Banknote,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

interface AnalyticsData {
  kpis: {
    totalGrossRevenue: number;
    paidRevenue: number;
    totalOrdersCount: number;
    pendingActionCount: number;
    avgOrderValue: number;
  };
  statusCounts: {
    pending: number;
    processing: number;
    shipped: number;
    fulfilled: number;
    cancelled: number;
  };
  paymentBreakdown: {
    cod: { count: number; revenue: number };
    stripe: { count: number; revenue: number };
  };
  dailySales: Array<{ date: string; label: string; revenue: number; orders: number }>;
  topProducts: Array<{
    id: string;
    name: string;
    slug: string;
    unitsSold: number;
    totalRevenue: number;
  }>;
  lowStockVariants: Array<{
    id: string;
    productName: string;
    slug: string;
    size: string;
    color: string;
    sku: string | null;
    stockQty: number;
  }>;
  recentOrders: Array<{
    id: string;
    total: number;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    createdAt: string;
    customerName: string;
    city: string;
  }>;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function loadAnalytics() {
    try {
      setRefreshing(true);
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized admin access");
        throw new Error("Failed to load analytics");
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading performance analytics…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card p-8 text-center max-w-md mx-auto mt-12 border-red-200 bg-red-50/50">
        <AlertTriangle className="mx-auto text-red-500 mb-3" size={32} />
        <h2 className="text-lg font-bold text-red-900 mb-1">Could Not Load Analytics</h2>
        <p className="text-sm text-red-700 mb-6">{error || "An unknown error occurred."}</p>
        <button
          onClick={loadAnalytics}
          className="btn-primary text-xs px-5 py-2.5 mx-auto"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { kpis, statusCounts, paymentBreakdown, dailySales, topProducts, lowStockVariants, recentOrders } = data;
  const maxDailyRevenue = Math.max(...dailySales.map((d) => d.revenue), 1000);
  const totalPaymentVol = paymentBreakdown.cod.revenue + paymentBreakdown.stripe.revenue || 1;
  const stripePercent = Math.round((paymentBreakdown.stripe.revenue / totalPaymentVol) * 100);
  const codPercent = 100 - stripePercent;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Performance & Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time business intelligence, revenue metrics, and inventory health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAnalytics}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin text-brand-600" : ""} />
            <span>{refreshing ? "Refreshing…" : "Refresh Data"}</span>
          </button>

          <Link
            href="/admin/orders"
            className="btn-primary text-xs px-4 py-2"
          >
            View All Orders →
          </Link>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Gross Revenue */}
        <div className="card p-5 bg-gradient-to-br from-white to-slate-50/50 border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Gross Revenue
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign size={18} />
            </span>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-950">
            Rs {kpis.totalGrossRevenue.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-emerald-600">Rs {kpis.paidRevenue.toLocaleString()}</span>
            <span>realized / paid</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="card p-5 bg-gradient-to-br from-white to-slate-50/50 border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Orders
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShoppingBag size={18} />
            </span>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-950">
            {kpis.totalOrdersCount}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{statusCounts.fulfilled}</span>
            <span>fulfilled successfully</span>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="card p-5 bg-gradient-to-br from-white to-slate-50/50 border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Average Order (AOV)
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp size={18} />
            </span>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-950">
            Rs {kpis.avgOrderValue.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <span>Average revenue per checkout</span>
          </div>
        </div>

        {/* Pending Action */}
        <div className="card p-5 bg-gradient-to-br from-white to-slate-50/50 border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Needs Fulfillment
            </span>
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              kpis.pendingActionCount > 0 ? "bg-amber-50 text-amber-600 animate-pulse" : "bg-slate-100 text-slate-500"
            }`}>
              <Clock size={18} />
            </span>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-950">
            {kpis.pendingActionCount}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span className={kpis.pendingActionCount > 0 ? "font-semibold text-amber-600" : ""}>
              {kpis.pendingActionCount > 0 ? "Orders awaiting dispatch" : "All orders caught up"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Middle Row: Sales Chart & Payment Channels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Sales Trend (2 cols) */}
        <div className="card p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Revenue Trend (Last 14 Days)</h2>
                <p className="text-xs text-slate-500">Daily sales velocity and order volume</p>
              </div>
              <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
                Live Data
              </span>
            </div>

            {/* Visual Bar Chart */}
            <div className="mt-6 pt-4 h-52 flex items-end justify-between gap-1 sm:gap-3 border-b border-slate-100 pb-2 overflow-x-auto">
              {dailySales.map((day) => {
                const heightPercent = Math.max(8, Math.round((day.revenue / maxDailyRevenue) * 100));
                return (
                  <div
                    key={day.date}
                    className="flex-1 min-w-[20px] sm:min-w-0 flex flex-col items-center gap-2 group relative h-full justify-end"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[11px] font-medium py-1.5 px-2.5 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                      <span>Rs {day.revenue.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-400">{day.orders} order{day.orders !== 1 ? "s" : ""}</span>
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        day.revenue > 0
                          ? "bg-gradient-to-t from-brand-600 to-indigo-500 group-hover:from-brand-700 group-hover:to-indigo-600 shadow-xs"
                          : "bg-slate-100 group-hover:bg-slate-200"
                      }`}
                    />
                    {/* Label */}
                    <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 group-hover:text-slate-700 truncate max-w-full">
                      {day.label.split(" ")[1]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-2">
            <span>14 days ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Payment Channels & Pipeline */}
        <div className="card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Payment & Pipeline</h2>
            <p className="text-xs text-slate-500 mb-6">Payment channels & fulfillment status</p>

            {/* Payment Method Split */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5 flex-wrap gap-1">
                  <span className="flex items-center gap-1.5">
                    <Banknote size={14} className="text-amber-600" /> Cash on Delivery (COD)
                  </span>
                  <span>Rs {paymentBreakdown.cod.revenue.toLocaleString()} ({paymentBreakdown.cod.count})</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{ width: `${codPercent}%` }}
                    className="h-full bg-amber-500 rounded-full transition-all duration-700"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5 flex-wrap gap-1">
                  <span className="flex items-center gap-1.5">
                    <CreditCard size={14} className="text-blue-600" /> Stripe / Cards
                  </span>
                  <span>Rs {paymentBreakdown.stripe.revenue.toLocaleString()} ({paymentBreakdown.stripe.count})</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{ width: `${stripePercent}%` }}
                    className="h-full bg-blue-600 rounded-full transition-all duration-700"
                  />
                </div>
              </div>
            </div>

            {/* Order Pipeline Status */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Order Pipeline
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-100 flex justify-between items-center">
                  <span className="text-amber-800 font-medium">Pending</span>
                  <span className="font-bold text-amber-900">{statusCounts.pending}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100 flex justify-between items-center">
                  <span className="text-blue-800 font-medium">Processing</span>
                  <span className="font-bold text-blue-900">{statusCounts.processing}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-100 flex justify-between items-center">
                  <span className="text-indigo-800 font-medium">Shipped</span>
                  <span className="font-bold text-indigo-900">{statusCounts.shipped}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-100 flex justify-between items-center">
                  <span className="text-emerald-800 font-medium">Fulfilled</span>
                  <span className="font-bold text-emerald-900">{statusCounts.fulfilled}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Top Products & Low Stock Alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Selling Products */}
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Top Best-Sellers</h2>
              <p className="text-xs text-slate-500">Highest grossing shirts in your store</p>
            </div>
            <Link
              href="/admin/products"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            >
              All Products →
            </Link>
          </div>

          {!topProducts || topProducts.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              <Package className="mx-auto mb-2 text-slate-300" size={28} />
              No sales recorded yet. Top performers will appear here as orders roll in.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {topProducts.map((p, idx) => (
                <div key={p.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">{p.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{p.unitsSold} units sold</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm text-slate-900">
                      Rs {p.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                Low Stock Alerts (≤ 5 units)
              </h2>
              <p className="text-xs text-slate-500">Items requiring immediate restocking</p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              lowStockVariants.length > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
            }`}>
              {lowStockVariants.length} warning{lowStockVariants.length !== 1 ? "s" : ""}
            </span>
          </div>

          {!lowStockVariants || lowStockVariants.length === 0 ? (
            <div className="text-center py-10 text-emerald-600 text-xs">
              <CheckCircle2 className="mx-auto mb-2 text-emerald-500" size={28} />
              All product variants are well stocked!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {lowStockVariants.map((v) => (
                <div key={v.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{v.productName}</p>
                    <p className="text-slate-500 mt-0.5">
                      Variant: <span className="font-medium text-slate-700">{v.size} / {v.color}</span>
                      {v.sku && <span className="ml-2 font-mono text-[11px] text-slate-400">SKU: {v.sku}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-xs">
                      {v.stockQty} left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Transactions Feed ── */}
      <div className="card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Transactions</h2>
            <p className="text-xs text-slate-500">Latest customer orders</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            Manage All Orders →
          </Link>
        </div>

        {!recentOrders || recentOrders.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No recent orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[560px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3">Order ID</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 font-mono font-bold text-slate-900">
                      #{o.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3 font-medium text-slate-900">
                      {o.customerName} {o.city ? `(${o.city})` : ""}
                    </td>
                    <td className="py-3 text-slate-500">
                      {new Date(o.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        o.paymentMethod === "cod" ? "bg-amber-50 text-amber-800" : "bg-blue-50 text-blue-800"
                      }`}>
                        {o.paymentMethod === "cod" ? "💵 COD" : "💳 Stripe"}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="capitalize font-medium text-slate-700">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold text-slate-900">
                      Rs {o.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
