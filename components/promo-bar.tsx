"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, Sparkles, Tag, X } from "lucide-react";
import { useCart } from "@/lib/store/cart";

export interface PromoData {
  id?: string;
  is_active: boolean;
  badge_text?: string | null;
  message: string;
  coupon_code?: string | null;
  cta_text?: string | null;
  cta_link?: string | null;
  theme: "dark" | "brand" | "emerald" | "amber" | "purple" | "crimson";
  can_dismiss?: boolean;
}

const THEME_STYLES: Record<string, { bg: string; badge: string; code: string; cta: string }> = {
  dark: {
    bg: "bg-slate-950 text-slate-100 border-b border-slate-800/80",
    badge: "bg-white/15 text-white border-white/20",
    code: "bg-white/10 hover:bg-white/20 text-emerald-300 border-white/20",
    cta: "bg-white text-slate-950 hover:bg-slate-100",
  },
  brand: {
    bg: "bg-gradient-to-r from-brand-700 via-indigo-700 to-brand-900 text-white border-b border-brand-500/30",
    badge: "bg-black/20 text-white border-white/20",
    code: "bg-white/15 hover:bg-white/25 text-amber-200 border-white/20",
    cta: "bg-white text-brand-950 hover:bg-brand-50",
  },
  emerald: {
    bg: "bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-950 text-emerald-100 border-b border-emerald-800/60",
    badge: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
    code: "bg-emerald-400/20 hover:bg-emerald-400/30 text-emerald-200 border-emerald-400/30",
    cta: "bg-emerald-400 text-slate-950 hover:bg-emerald-300 font-semibold",
  },
  amber: {
    bg: "bg-gradient-to-r from-amber-950 via-orange-950 to-slate-950 text-amber-100 border-b border-amber-700/40",
    badge: "bg-amber-500/25 text-amber-200 border-amber-400/30",
    code: "bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border-amber-400/30",
    cta: "bg-amber-400 text-slate-950 hover:bg-amber-300 font-semibold",
  },
  purple: {
    bg: "bg-gradient-to-r from-purple-950 via-fuchsia-950 to-slate-950 text-purple-100 border-b border-purple-700/40",
    badge: "bg-purple-500/25 text-purple-200 border-purple-400/30",
    code: "bg-purple-400/20 hover:bg-purple-400/30 text-purple-200 border-purple-400/30",
    cta: "bg-purple-300 text-slate-950 hover:bg-purple-200 font-semibold",
  },
  crimson: {
    bg: "bg-gradient-to-r from-rose-950 via-red-950 to-slate-950 text-rose-100 border-b border-rose-800/60",
    badge: "bg-rose-500/25 text-rose-200 border-rose-400/30",
    code: "bg-rose-400/20 hover:bg-rose-400/30 text-rose-200 border-rose-400/30",
    cta: "bg-rose-400 text-slate-950 hover:bg-rose-300 font-semibold",
  },
};

interface PromoBarProps {
  initialPromo?: PromoData | null;
}

export function PromoBar({ initialPromo }: PromoBarProps) {
  const [promo, setPromo] = useState<PromoData | null>(initialPromo ?? null);
  const [dismissed, setDismissed] = useState(true);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const applyCoupon = useCart((s) => s.applyCoupon);
  const appliedCoupon = useCart((s) => s.appliedCoupon);

  useEffect(() => {
    // Check session dismissal
    const isDismissed = sessionStorage.getItem("store_promo_dismissed") === "true";
    setDismissed(isDismissed);

    async function fetchPromo() {
      try {
        const res = await fetch("/api/promos", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.promo && json.promo.is_active) {
            setPromo(json.promo);
          } else {
            setPromo(null);
          }
        }
      } catch (err) {
        console.warn("Failed to load storefront promo:", err);
      }
    }

    fetchPromo();
  }, []);

  // ── Senior-level logic: hide banner if user already claimed this exact offer ──
  // The cart store persists to localStorage, so this survives page refreshes and
  // new sessions. If admin changes the promo code, the mismatch causes it to reappear.
  const alreadyClaimed =
    !!promo?.coupon_code &&
    !!appliedCoupon?.code &&
    appliedCoupon.code.toUpperCase() === promo.coupon_code.toUpperCase();

  if (!promo || !promo.is_active || dismissed || alreadyClaimed) {
    return null;
  }

  const themeStyle = THEME_STYLES[promo.theme] || THEME_STYLES.dark;

  const handleClaimOrCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);

      // Auto-apply discount in Cart state
      const STANDARD_PERCENTAGES: Record<string, number> = {
        SAVE20: 20,
        SAVE15: 15,
        SAVE10: 10,
        WELCOME15: 15,
        WELCOME10: 10,
        SUMMERDROP: 25,
        VIP20: 20,
        FREESHIP: 10,
      };

      const upperCode = code.toUpperCase();
      let discountPercent = STANDARD_PERCENTAGES[upperCode] ?? 20;

      if (!STANDARD_PERCENTAGES[upperCode]) {
        const numMatch = code.match(/\d+/);
        if (numMatch) {
          discountPercent = parseInt(numMatch[0], 10);
        } else {
          const msgMatch = (promo.message || "").match(/(\d+)\s*%/);
          if (msgMatch) {
            discountPercent = parseInt(msgMatch[1], 10);
          }
        }
      }

      const safePercent = Math.min(Math.max(discountPercent, 5), 80);

      applyCoupon({
        code,
        discountPercent: safePercent,
        description: promo.badge_text || `${safePercent}% Off Offer`,
      });

      setToastMessage(`🎉 Coupon "${code}" copied & applied to your cart! (${safePercent}% OFF)`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error("Failed to copy promo code:", err);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("store_promo_dismissed", "true");
    } catch {}
  };

  return (
    <>
      <aside
        aria-label="Promotional Announcement"
        className={`relative z-40 w-full py-2 px-3 sm:px-6 transition-all duration-300 shadow-xs ${themeStyle.bg}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-3 text-xs sm:text-sm">
          {/* Left / Center: Announcement Content */}
          <div className="flex flex-1 items-center justify-center flex-wrap gap-1.5 sm:gap-2 text-center sm:text-left">
            {/* Badge */}
            {promo.badge_text && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] sm:text-xs font-bold uppercase tracking-wider border backdrop-blur-sm shadow-xs shrink-0 ${themeStyle.badge}`}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
                </span>
                {promo.badge_text}
              </span>
            )}

            {/* Message */}
            <span className="font-medium tracking-tight text-slate-100 text-[11px] sm:text-sm">
              {promo.message}
            </span>

            {/* Coupon Code Pill */}
            {promo.coupon_code && (
              <button
                type="button"
                onClick={() => handleClaimOrCopy(promo.coupon_code!)}
                className={`group inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[10px] sm:text-[11px] font-mono font-bold tracking-wider border transition-all active:scale-95 shadow-xs cursor-pointer ${themeStyle.code}`}
                title="Click to copy & auto-apply coupon code"
              >
                <Tag size={10} className="opacity-70 group-hover:scale-110 transition-transform" />
                <span>{promo.coupon_code}</span>
                {copied ? (
                  <span className="inline-flex items-center gap-0.5 text-emerald-400 font-sans font-semibold text-[9px] sm:text-[10px]">
                    <Check size={10} /> Applied!
                  </span>
                ) : (
                  <Copy size={9} className="opacity-60 group-hover:opacity-100" />
                )}
              </button>
            )}

            {/* CTA Link */}
            {promo.cta_text && promo.cta_link && (
              <Link
                href={promo.cta_link}
                onClick={() => {
                  if (promo.coupon_code) {
                    handleClaimOrCopy(promo.coupon_code);
                  }
                }}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] sm:text-xs font-semibold tracking-wide transition-all shadow-xs hover:gap-1.5 active:scale-95 shrink-0 ${themeStyle.cta}`}
              >
                <span>{promo.cta_text}</span>
                <ArrowRight size={10} />
              </Link>
            )}
          </div>

          {/* Dismiss Button */}
          {promo.can_dismiss !== false && (
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              aria-label="Dismiss announcement"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </aside>

      {/* Floating Auto-Apply Confirmation Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900 text-white px-5 py-3.5 shadow-2xl border border-slate-700 animate-slide-up">
          <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
}
