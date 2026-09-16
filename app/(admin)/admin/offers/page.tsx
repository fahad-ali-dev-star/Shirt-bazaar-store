"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  Megaphone,
  Palette,
  Percent,
  RefreshCw,
  Sparkles,
  Tag,
  ToggleLeft,
  ToggleRight,
  Truck,
  X,
  Zap,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Clock,
  ShieldCheck,
  BarChart3,
  Award,
} from "lucide-react";

interface PromoConfig {
  id?: string;
  is_active: boolean;
  badge_text: string;
  message: string;
  coupon_code: string;
  cta_text: string;
  cta_link: string;
  theme: "dark" | "brand" | "emerald" | "amber" | "purple" | "crimson";
  can_dismiss: boolean;
}

interface PromoAnalytics {
  totalStoreOrders: number;
  totalPromoOrders: number;
  totalPromoRevenue: number;
  totalDiscountGiven: number;
  promoUsageRate: number;
  codeBreakdown: Array<{
    code: string;
    count: number;
    revenue: number;
    discount: number;
  }>;
  recentPromoOrders: Array<{
    id: string;
    code: string;
    customerName: string;
    city: string;
    total: number;
    estimatedSavings: number;
    status: string;
    createdAt: string;
    paymentMethod: string;
  }>;
}

const CAMPAIGN_PRESETS = [
  {
    icon: <Zap className="h-4 w-4 text-amber-500" />,
    name: "Flash Sale 20% OFF",
    badge: "FLASH SALE ⚡",
    message: "Get 20% off all heavyweight cotton shirts this week!",
    code: "SAVE20",
    cta_text: "Shop Sale",
    cta_link: "/#products",
    theme: "amber" as const,
  },
  {
    icon: <Truck className="h-4 w-4 text-emerald-500" />,
    name: "Free Express Shipping",
    badge: "FREE SHIPPING 🚚",
    message: "Enjoy free express shipping on all orders over Rs 3,000!",
    code: "FREESHIP",
    cta_text: "Explore Catalog",
    cta_link: "/#products",
    theme: "emerald" as const,
  },
  {
    icon: <Percent className="h-4 w-4 text-indigo-500" />,
    name: "New Customer 15%",
    badge: "WELCOME OFFER 🎉",
    message: "Welcome to FHD Store! Take 15% off your first checkout.",
    code: "WELCOME15",
    cta_text: "Claim 15%",
    cta_link: "/#products",
    theme: "brand" as const,
  },
  {
    icon: <Sparkles className="h-4 w-4 text-rose-500" />,
    name: "Summer 2026 Drop 25%",
    badge: "EXCLUSIVE DROP 🔥",
    message: "Summer 2026 limited drop now live! 25% off today only.",
    code: "SUMMERDROP",
    cta_text: "View Collection",
    cta_link: "/#products",
    theme: "crimson" as const,
  },
];

const THEME_OPTIONS = [
  {
    id: "dark",
    name: "Sleek Carbon",
    bgClass: "bg-slate-950 text-white border-slate-800",
    dot: "bg-slate-900 border-slate-700",
  },
  {
    id: "brand",
    name: "Brand Violet",
    bgClass: "bg-gradient-to-r from-brand-700 via-indigo-700 to-brand-900 text-white",
    dot: "bg-brand-600",
  },
  {
    id: "emerald",
    name: "Emerald Green",
    bgClass: "bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-950 text-emerald-100",
    dot: "bg-emerald-600",
  },
  {
    id: "amber",
    name: "Flash Amber",
    bgClass: "bg-gradient-to-r from-amber-950 via-orange-950 to-slate-950 text-amber-100",
    dot: "bg-amber-500",
  },
  {
    id: "purple",
    name: "Royal Purple",
    bgClass: "bg-gradient-to-r from-purple-950 via-fuchsia-950 to-slate-950 text-purple-100",
    dot: "bg-purple-600",
  },
  {
    id: "crimson",
    name: "Crimson Rose",
    bgClass: "bg-gradient-to-r from-rose-950 via-red-950 to-slate-950 text-rose-100",
    dot: "bg-rose-600",
  },
];

export default function AdminOffersPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedTest, setCopiedTest] = useState(false);
  const [analytics, setAnalytics] = useState<PromoAnalytics | null>(null);

  const [form, setForm] = useState<PromoConfig>({
    is_active: true,
    badge_text: "FLASH SALE ⚡",
    message: "Enjoy 20% OFF all premium shirts this week only!",
    coupon_code: "SAVE20",
    cta_text: "Claim Discount",
    cta_link: "/#products",
    theme: "amber",
    can_dismiss: true,
  });

  async function loadData() {
    try {
      const res = await fetch("/api/admin/promos");
      if (res.ok) {
        const json = await res.json();
        if (json.promo) {
          setForm({
            id: json.promo.id,
            is_active: json.promo.is_active ?? true,
            badge_text: json.promo.badge_text || "",
            message: json.promo.message || "",
            coupon_code: json.promo.coupon_code || "",
            cta_text: json.promo.cta_text || "",
            cta_link: json.promo.cta_link || "/#products",
            theme: json.promo.theme || "dark",
            can_dismiss: json.promo.can_dismiss ?? true,
          });
        }
        if (json.analytics) {
          setAnalytics(json.analytics);
        }
      }
    } catch (err) {
      console.error("Failed to load promo & analytics:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleQuickToggle(newActiveState: boolean) {
    setToggling(true);
    setError(null);
    setForm((prev) => ({ ...prev, is_active: newActiveState }));

    try {
      const res = await fetch("/api/admin/promos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          is_active: newActiveState,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to update status");
      }

      const json = await res.json();
      if (json.promo?.id) {
        setForm((prev) => ({ ...prev, id: json.promo.id, is_active: json.promo.is_active }));
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error updating status");
      // Revert state on error
      setForm((prev) => ({ ...prev, is_active: !newActiveState }));
    } finally {
      setToggling(false);
    }
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/admin/promos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to save promo banner");
      }

      const json = await res.json();
      if (json.promo?.id) {
        setForm((prev) => ({ ...prev, id: json.promo.id }));
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving promo banner");
    } finally {
      setSaving(false);
    }
  }

  const applyPreset = (preset: (typeof CAMPAIGN_PRESETS)[0]) => {
    setForm((prev) => ({
      ...prev,
      badge_text: preset.badge,
      message: preset.message,
      coupon_code: preset.code,
      cta_text: preset.cta_text,
      cta_link: preset.cta_link,
      theme: preset.theme,
    }));
  };

  const handleTestCopy = async () => {
    if (!form.coupon_code) return;
    try {
      await navigator.clipboard.writeText(form.coupon_code);
      setCopiedTest(true);
      setTimeout(() => setCopiedTest(false), 2000);
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading offers & analytics...</p>
        </div>
      </div>
    );
  }

  const selectedThemeStyle =
    THEME_OPTIONS.find((t) => t.id === form.theme) || THEME_OPTIONS[0];

  return (
    <div className="mx-auto max-w-7xl px-3.5 sm:px-6 py-4 sm:py-8 space-y-8 animate-fade-in">
      {/* ── Top Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl flex items-center gap-2">
              <Megaphone className="h-6 w-6 sm:h-7 sm:w-7 text-brand-600 shrink-0" />
              <span>Offers & Promotions Hub</span>
            </h1>
            <button
              type="button"
              onClick={() => handleQuickToggle(!form.is_active)}
              disabled={toggling}
              className={`rounded-full px-3 py-1 text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                form.is_active
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                  : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
              }`}
              title="Click to toggle status"
            >
              {toggling ? (
                <RefreshCw size={11} className="animate-spin" />
              ) : form.is_active ? (
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-slate-400" />
              )}
              <span>{form.is_active ? "● Live on Storefront" : "○ Inactive / Off"}</span>
            </button>
          </div>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
            Configure store announcements, publish flash discount codes, and analyze promotional campaign performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <Eye className="h-4 w-4 text-slate-500" />
            <span>View Storefront</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </Link>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition shadow-sm cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Saved & Live!</span>
              </>
            ) : (
              <span>Publish Changes</span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 animate-slide-down">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Offers and promotional announcement settings have been updated successfully!</span>
        </div>
      )}

      {/* ── SECTION 1: OFFERS & PROMOS ANALYSIS & KPI CARDS ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">Offers & Promo Analytics</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Real-time coupon redemption metrics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Status */}
          <div className="card p-5 bg-gradient-to-br from-white to-slate-50/60 border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Offer Status
              </span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                  form.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                }`}
              >
                <Zap size={16} />
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className={`text-xl sm:text-2xl font-extrabold ${form.is_active ? "text-emerald-700" : "text-slate-600"}`}>
                {form.is_active ? "Active & Live" : "Inactive / Off"}
              </p>
              <button
                type="button"
                onClick={() => handleQuickToggle(!form.is_active)}
                disabled={toggling}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                  form.is_active
                    ? "bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border-slate-200"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
                }`}
              >
                {toggling ? "Saving..." : form.is_active ? "Turn Off" : "Turn On"}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {form.is_active
                ? `Current active code: ${form.coupon_code || "None"}`
                : "Banner ribbon is hidden from storefront shoppers"}
            </p>
          </div>

          {/* Card 2: Promo Revenue */}
          <div className="card p-5 bg-gradient-to-br from-white to-slate-50/60 border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Promo Sales Volume
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <DollarSign size={16} />
              </span>
            </div>
            <p className="mt-3 text-xl sm:text-2xl font-extrabold text-slate-950">
              Rs {(analytics?.totalPromoRevenue || 0).toLocaleString()}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              From <strong className="text-slate-700">{analytics?.totalPromoOrders || 0}</strong> coupon-assisted checkout{analytics?.totalPromoOrders !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Card 3: Discounts Given */}
          <div className="card p-5 bg-gradient-to-br from-white to-slate-50/60 border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Discounts Distributed
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Tag size={16} />
              </span>
            </div>
            <p className="mt-3 text-xl sm:text-2xl font-extrabold text-amber-700">
              Rs {(analytics?.totalDiscountGiven || 0).toLocaleString()}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Total price reduction saved by customers
            </p>
          </div>

          {/* Card 4: Redemptions & Usage */}
          <div className="card p-5 bg-gradient-to-br from-white to-slate-50/60 border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Promo Usage Rate
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <TrendingUp size={16} />
              </span>
            </div>
            <p className="mt-3 text-xl sm:text-2xl font-extrabold text-slate-950">
              {analytics?.promoUsageRate || 0}%
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Of all <strong className="text-slate-700">{analytics?.totalStoreOrders || 0}</strong> store orders used a coupon
            </p>
          </div>
        </div>

        {/* ── Coupon Performance Breakdown & Recent Redemptions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
          {/* Top Promo Codes Breakdown */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Award size={16} className="text-brand-600" />
              <span>Coupon Campaign Leaderboard</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">Performance breakdown by coupon code</p>

            {!analytics?.codeBreakdown || analytics.codeBreakdown.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Tag className="mx-auto mb-1 text-slate-300" size={20} />
                No coupon redemptions recorded yet. As customers apply promo codes, breakdown will appear here.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {analytics.codeBreakdown.map((item, idx) => (
                  <div key={item.code} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {item.code}
                        </span>
                        <span className="text-slate-500 ml-2">
                          {item.count} order{item.count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-slate-900">Rs {item.revenue.toLocaleString()}</p>
                      <p className="text-[11px] text-emerald-600">Saved Rs {item.discount.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Promo Orders */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <ShoppingBag size={16} className="text-indigo-600" />
              <span>Recent Discounted Orders</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">Latest checkouts with coupon codes</p>

            {!analytics?.recentPromoOrders || analytics.recentPromoOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Clock className="mx-auto mb-1 text-slate-300" size={20} />
                No discounted orders in feed.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
                {analytics.recentPromoOrders.map((ord) => (
                  <div key={ord.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-slate-900">
                          #{ord.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="font-mono text-[10px] font-bold bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded border border-amber-200">
                          {ord.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {ord.customerName} {ord.city ? `(${ord.city})` : ""} · {new Date(ord.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-slate-900">Rs {ord.total.toLocaleString()}</p>
                      <span className="capitalize text-[10px] font-semibold text-slate-500">{ord.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 2: LIVE STOREFRONT PREVIEW ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`flex h-2.5 w-2.5 rounded-full ${form.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Live Storefront Preview (What Customers See)
            </h3>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
            form.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
          }`}>
            {form.is_active ? "Currently Visible on All Pages" : "Currently Hidden (OFF)"}
          </span>
        </div>

        {/* Mock browser header frame */}
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-inner bg-slate-50">
          <div className="bg-slate-200/80 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="mx-auto text-[11px] font-mono text-slate-500 bg-white px-3 py-0.5 rounded-md border border-slate-200">
              shirtbazaar.pk
            </div>
          </div>

          {/* Rendered Announcement Bar */}
          {form.is_active ? (
            <div
              className={`w-full py-2.5 px-4 flex items-center justify-between gap-3 text-xs sm:text-sm transition-all duration-300 ${selectedThemeStyle.bgClass}`}
            >
              <div className="flex flex-1 items-center justify-center flex-wrap gap-2 text-center">
                {form.badge_text && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-white/20 border border-white/25 text-white shadow-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />
                    {form.badge_text}
                  </span>
                )}

                <span className="font-medium text-slate-100">{form.message || "Enter your promo message..."}</span>

                {form.coupon_code && (
                  <button
                    type="button"
                    onClick={handleTestCopy}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-mono font-bold tracking-wider bg-white/15 hover:bg-white/25 border border-white/25 text-white transition active:scale-95 shadow-xs cursor-pointer"
                    title="Test copy code"
                  >
                    <Tag size={10} />
                    <span>{form.coupon_code}</span>
                    {copiedTest ? (
                      <span className="text-emerald-300 text-[10px] font-sans font-bold flex items-center gap-0.5">
                        <Check size={10} /> Copied!
                      </span>
                    ) : (
                      <Copy size={10} className="opacity-70" />
                    )}
                  </button>
                )}

                {form.cta_text && (
                  <span className="inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[11px] font-semibold bg-white text-slate-950 shadow-xs">
                    <span>{form.cta_text}</span>
                    <ArrowRight size={10} />
                  </span>
                )}
              </div>

              {form.can_dismiss && (
                <span className="text-white/60 p-1">
                  <X size={14} />
                </span>
              )}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-500 bg-slate-100/80 flex flex-col items-center justify-center gap-2">
              <span className="font-semibold text-slate-700">Banner is currently OFF (Inactive)</span>
              <p className="text-[11px] text-slate-400 max-w-sm">Shoppers will not see any promotional announcement ribbon on the storefront.</p>
              <button
                type="button"
                onClick={() => handleQuickToggle(true)}
                className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition cursor-pointer"
              >
                <Zap size={12} />
                <span>Turn Banner ON</span>
              </button>
            </div>
          )}

          {/* Mock Navigation Strip underneath */}
          <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center justify-between text-xs opacity-60">
            <span className="font-bold text-slate-800">FHD Store.</span>
            <div className="flex gap-4 text-slate-600">
              <span>Home</span>
              <span>Catalog</span>
              <span>Cart (0)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: FORM CONFIGURATION ── */}
      <form onSubmit={(e) => handleSave(e)} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Form Controls (8 cols) */}
        <div className="space-y-6 lg:col-span-8">
          {/* Card 1: Visibility & Quick Campaign Presets */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between pb-5 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  1. Visibility Status
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Turn the banner on or off across your storefront with one click.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, is_active: !p.is_active }))}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition cursor-pointer ${
                  form.is_active
                    ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                {form.is_active ? (
                  <>
                    <ToggleRight className="h-5 w-5" />
                    <span>Active (Visible)</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-5 w-5" />
                    <span>Inactive (Hidden)</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Presets */}
            <div className="mt-5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                ⚡ Quick Campaign Presets (Click to Load)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CAMPAIGN_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-brand-500 hover:bg-brand-50/30 transition group cursor-pointer"
                  >
                    <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-white transition shrink-0">
                      {p.icon}
                    </div>
                    <div>
                      <span className="block font-semibold text-slate-900 text-xs">{p.name}</span>
                      <span className="block text-[11px] text-slate-500 mt-0.5 line-clamp-1">{p.message}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Copywriting & Coupon Code */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Tag className="h-4 w-4 text-brand-600" />
              <span>2. Copywriting & Discount Code</span>
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Badge / Tag
                  </label>
                  <input
                    type="text"
                    value={form.badge_text}
                    onChange={(e) => setForm((p) => ({ ...p, badge_text: e.target.value }))}
                    placeholder="FLASH SALE ⚡"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-black focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Main Announcement Message
                  </label>
                  <input
                    type="text"
                    value={form.message}
                    onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                    placeholder="Get 20% off all heavyweight shirts this weekend!"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-black focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Coupon Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.coupon_code}
                    onChange={(e) => setForm((p) => ({ ...p, coupon_code: e.target.value.toUpperCase() }))}
                    placeholder="SAVE20"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono font-bold uppercase text-slate-900 focus:border-black focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Customers can 1-click copy this code.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Button Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.cta_text}
                    onChange={(e) => setForm((p) => ({ ...p, cta_text: e.target.value }))}
                    placeholder="Shop Sale"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Button Link Destination
                  </label>
                  <input
                    type="text"
                    value={form.cta_link}
                    onChange={(e) => setForm((p) => ({ ...p, cta_link: e.target.value }))}
                    placeholder="/#products"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-black focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Color Themes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Palette className="h-4 w-4 text-brand-600" />
              <span>3. Color Theme & Appearance</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {THEME_OPTIONS.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, theme: theme.id as any }))}
                  className={`rounded-xl border-2 p-3 text-left transition flex items-center gap-3 cursor-pointer ${
                    form.theme === theme.id
                      ? "border-black bg-slate-50 ring-2 ring-black/10"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className={`h-6 w-6 rounded-full shrink-0 shadow-xs ${theme.dot}`} />
                  <div>
                    <span className="block font-semibold text-slate-900 text-xs">{theme.name}</span>
                    <span className="block text-[10px] text-slate-400 capitalize">{theme.id} style</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Allow Visitors to Dismiss (X button)</span>
                <span className="text-[11px] text-slate-500">Allows shoppers to hide the ribbon for their active browsing session.</span>
              </div>
              <input
                type="checkbox"
                checked={form.can_dismiss}
                onChange={(e) => setForm((p) => ({ ...p, can_dismiss: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-black focus:ring-black cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Tips & Best Practices (4 cols) */}
        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>💡 Offers Best Practices</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-900">
                <p className="font-semibold mb-0.5">⚡ Keep Copy Short & Punchy</p>
                <p className="text-[11px]">Keep announcement messages under 60 characters so they fit cleanly on mobile screens without wrapping too many lines.</p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-900">
                <p className="font-semibold mb-0.5">🏷️ Auto-Apply Codes</p>
                <p className="text-[11px]">When coupon codes are present, a <strong>Copy</strong> button appears automatically and auto-applies discount in cart.</p>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-900">
                <p className="font-semibold mb-0.5">🚀 Instant Active/Inactive</p>
                <p className="text-[11px]">Toggling the status switch immediately updates the live storefront without rebuilding or restarting.</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={saving}
                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50 transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Publish to Storefront</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

