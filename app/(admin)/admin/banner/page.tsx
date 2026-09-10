"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, RefreshCw, CheckCircle2, Eye, ImageIcon, Maximize2, Sliders } from "lucide-react";

interface BannerConfig {
  id?: string;
  is_active: boolean;
  image_url: string;
  badge_text: string;
  title: string;
  subtitle: string;
  cta_text: string;
  cta_link: string;
  secondary_cta_text: string;
  secondary_cta_link: string;
  overlay_opacity: number;
  banner_height: "tall" | "screen" | "standard";
  image_fit: "cover" | "contain";
}

const PRESET_BANNERS = [
  {
    label: "Minimalist Studio Cotton",
    url: "/hero_banner.png",
  },
  {
    label: "Urban Dark Streetwear",
    url: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1920&q=80",
  },
  {
    label: "Clean Monochrome Apparel",
    url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1920&q=80",
  },
];

export default function AdminBannerPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<BannerConfig>({
    is_active: true,
    image_url: "/hero_banner.png",
    badge_text: "SPRING / SUMMER 2026 DROP",
    title: "Essentials, Elevated.",
    subtitle: "Discover our new collection of premium cotton t-shirts. Designed for everyday comfort, crafted to last a lifetime.",
    cta_text: "Shop Collection",
    cta_link: "#products",
    secondary_cta_text: "Explore Oversized",
    secondary_cta_link: "/category/oversized",
    overlay_opacity: 50,
    banner_height: "tall",
    image_fit: "cover",
  });

  useEffect(() => {
    async function loadBanner() {
      try {
        const res = await fetch("/api/admin/banner");
        if (res.ok) {
          const json = await res.json();
          if (json.banner) {
            setForm({
              id: json.banner.id,
              is_active: json.banner.is_active ?? true,
              image_url: json.banner.image_url || "/hero_banner.png",
              badge_text: json.banner.badge_text || "",
              title: json.banner.title || "Essentials, Elevated.",
              subtitle: json.banner.subtitle || "",
              cta_text: json.banner.cta_text || "Shop Collection",
              cta_link: json.banner.cta_link || "#products",
              secondary_cta_text: json.banner.secondary_cta_text || "",
              secondary_cta_link: json.banner.secondary_cta_link || "",
              overlay_opacity: json.banner.overlay_opacity ?? 50,
              banner_height: json.banner.banner_height || "tall",
              image_fit: json.banner.image_fit || "cover",
            });
          }
        }
      } catch (err: unknown) {
        console.error("Failed to load banner config:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBanner();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/admin/banner", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, media_type: "image" }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to save banner");
      }

      const json = await res.json();
      if (json.banner?.id) {
        setForm((prev) => ({ ...prev, id: json.banner.id }));
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving banner");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3.5 sm:px-6 py-4 sm:py-8">
      {/* Top Header */}
      <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Homepage Hero Banner Manager
            </h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
              High Impact Cover
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Control the prime digital billboard of your store. Adjust height, cover fit, image URL, and text contrast.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <Eye className="h-4 w-4 text-slate-500" />
            <span>View Live Storefront</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition shadow-sm"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span>Published!</span>
              </>
            ) : (
              <span>Publish Changes</span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {saveSuccess && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span>Hero banner updated successfully! Live on your storefront.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Card 1: Image URL & Sizing */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-brand-600" />
              <span>1. Image URL & Display Adjustment</span>
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Image Path / Direct URL
                </label>
                <input
                  type="text"
                  value={form.image_url}
                  onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
                  placeholder="/hero_banner.png or https://..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-slate-800 placeholder-slate-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  required
                />
              </div>

              {/* Banner Height Options */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Hero Height Option
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "tall", label: "Extra Tall (880px)", desc: "Show maximum photo" },
                    { id: "screen", label: "Full Viewport (100vh)", desc: "Covers entire screen" },
                    { id: "standard", label: "Standard (640px)", desc: "Compact layout" },
                  ].map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, banner_height: h.id as any }))}
                      className={`rounded-xl border-2 p-3 text-left transition ${
                        form.banner_height === h.id
                          ? "border-brand-600 bg-brand-50/50 ring-2 ring-brand-100"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className="block font-semibold text-slate-900 text-xs">{h.label}</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">{h.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Fit: Cover vs Contain (Show Full Image) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Image Fit Adjustment
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, image_fit: "cover" }))}
                    className={`rounded-xl border-2 p-3 text-left transition ${
                      form.image_fit === "cover"
                        ? "border-brand-600 bg-brand-50/50 ring-2 ring-brand-100"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="block font-semibold text-slate-900 text-xs">Object Cover (Fill All)</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      Fills entire space from edge-to-edge without empty gaps.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, image_fit: "contain" }))}
                    className={`rounded-xl border-2 p-3 text-left transition ${
                      form.image_fit === "contain"
                        ? "border-brand-600 bg-brand-50/50 ring-2 ring-brand-100"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="block font-semibold text-slate-900 text-xs">Object Contain (Show Full Uncut Image)</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      Displays 100% of the image with zero cropping.
                    </span>
                  </button>
                </div>
              </div>

              {/* Quick Image Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  Quick Image Presets:
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_BANNERS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, image_url: preset.url }))}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        form.image_url === preset.url
                          ? "border-brand-600 bg-brand-50 text-brand-700 font-semibold"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      🖼️ {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vignette Overlay Slider */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Dark Vignette Overlay ({form.overlay_opacity}%)
                  </label>
                  <span className="text-xs text-slate-500">Lower = Brighter photo, Higher = Sharper text</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="5"
                  value={form.overlay_opacity}
                  onChange={(e) => setForm((p) => ({ ...p, overlay_opacity: Number(e.target.value) }))}
                  className="w-full accent-black cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Headline & Text */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              2. Headlines & Copywriting
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Campaign Tagline / Badge
                </label>
                <input
                  type="text"
                  value={form.badge_text}
                  onChange={(e) => setForm((p) => ({ ...p, badge_text: e.target.value }))}
                  placeholder="SPRING / SUMMER 2026 DROP"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Main Headline
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Essentials, Elevated."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-base font-medium text-slate-900 focus:border-black focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Subtitle Description
                </label>
                <textarea
                  rows={3}
                  value={form.subtitle}
                  onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
                  placeholder="Discover our new collection of heavy-cotton and oversized shirts..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-800 focus:border-black focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Call To Action Buttons */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              3. Call-To-Action (CTA) Buttons
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Primary Button Text
                </label>
                <input
                  type="text"
                  value={form.cta_text}
                  onChange={(e) => setForm((p) => ({ ...p, cta_text: e.target.value }))}
                  placeholder="Shop Collection"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-black focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Primary Button Link
                </label>
                <input
                  type="text"
                  value={form.cta_link}
                  onChange={(e) => setForm((p) => ({ ...p, cta_link: e.target.value }))}
                  placeholder="#products or /category/t-shirts"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-black focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Secondary Button Text (Optional)
                </label>
                <input
                  type="text"
                  value={form.secondary_cta_text}
                  onChange={(e) => setForm((p) => ({ ...p, secondary_cta_text: e.target.value }))}
                  placeholder="Explore Oversized"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Secondary Button Link
                </label>
                <input
                  type="text"
                  value={form.secondary_cta_link}
                  onChange={(e) => setForm((p) => ({ ...p, secondary_cta_link: e.target.value }))}
                  placeholder="/category/oversized"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-black focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Realtime Live Preview (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Realtime Storefront Preview
                </h3>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                {form.banner_height === "tall" ? "880px Height" : form.banner_height === "screen" ? "100vh Height" : "640px Height"}
              </span>
            </div>

            {/* Mini Storefront Hero Mockup with proportional height */}
            <div className={`relative ${form.banner_height === "screen" ? "aspect-[4/3]" : form.banner_height === "tall" ? "aspect-[16/11]" : "aspect-[16/9]"} w-full overflow-hidden rounded-xl bg-slate-950 text-white shadow-inner flex flex-col justify-end p-6 border border-slate-800 transition-all`}>
              {/* Background Image rendering mode */}
              <div
                className={`absolute inset-0 h-full w-full ${form.image_fit === "contain" ? "bg-contain bg-no-repeat bg-center" : "bg-cover bg-center"} transition-all duration-300`}
                style={{ backgroundImage: `url(${form.image_url || "/hero_banner.png"})` }}
              />

              {/* Dynamic Overlay */}
              <div
                className="absolute inset-0 bg-black transition-opacity"
                style={{ opacity: form.overlay_opacity / 100 }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

              {/* Content Overlay */}
              <div className="relative z-10 space-y-2">
                {form.badge_text && (
                  <span className="inline-block rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-white border border-white/30">
                    {form.badge_text}
                  </span>
                )}
                <h4 className="text-2xl font-bold tracking-tight text-white leading-tight">
                  {form.title}
                </h4>
                {form.subtitle && (
                  <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed opacity-90">
                    {form.subtitle}
                  </p>
                )}

                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-950 shadow-sm">
                    {form.cta_text}
                    <ArrowRight className="h-3 w-3" />
                  </span>
                  {form.secondary_cta_text && (
                    <span className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-white border border-white/20">
                      {form.secondary_cta_text}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-600 border border-slate-100">
              <p className="font-semibold text-slate-800 mb-1">📐 Fit Options:</p>
              <p>
                • <strong>Object Cover</strong>: Expands your image to fill the entire tall screen with zero whitespace.<br />
                • <strong>Object Contain</strong>: Shows the <strong>full uncut image</strong> without cropping any borders.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
