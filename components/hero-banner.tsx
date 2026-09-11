"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";

export interface HeroBannerData {
  id?: string;
  is_active?: boolean;
  image_url?: string | null;
  badge_text?: string | null;
  title: string;
  subtitle: string;
  cta_text: string;
  cta_link: string;
  secondary_cta_text?: string | null;
  secondary_cta_link?: string | null;
  overlay_opacity?: number;
  banner_height?: "screen" | "tall" | "standard";
  image_fit?: "cover" | "contain";
}

interface HeroBannerProps {
  banner?: HeroBannerData | null;
}

export function HeroBanner({ banner }: HeroBannerProps) {
  const imageUrl = banner?.image_url || "/hero_banner.png";
  const badgeText = banner?.badge_text ?? "SPRING / SUMMER 2026 DROP";
  const title = banner?.title || "Essentials, Elevated.";
  const subtitle =
    banner?.subtitle ||
    "Discover our new collection of premium cotton t-shirts. Designed for everyday comfort, crafted to last a lifetime.";
  const ctaText = banner?.cta_text || "Shop the Collection";
  const ctaLink = banner?.cta_link || "#products";
  const secondaryCtaText = banner?.secondary_cta_text;
  const secondaryCtaLink = banner?.secondary_cta_link;
  const opacity =
    typeof banner?.overlay_opacity === "number" ? banner.overlay_opacity : 40;
  const imageFit = banner?.image_fit === "contain" ? "object-contain" : "object-cover";

  const height =
    banner?.banner_height === "screen"
      ? "h-screen max-h-[700px]"
      : banner?.banner_height === "standard"
      ? "h-[380px]"
      : "h-[520px]"; // tall (default)

  return (
    <section className={`relative w-full ${height} bg-slate-950 flex items-start overflow-hidden`}>
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src={imageUrl}
          alt={title}
          fill
          priority
          sizes="100vw"
          className={`w-full h-full ${imageFit} object-center`}
          quality={80}
        />

        {/* Dynamic vignette */}
        <div
          className="absolute inset-0 bg-black pointer-events-none"
          style={{ opacity: opacity / 100 }}
        />

        {/* Left-to-right gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/10 pointer-events-none" />

        {/* Bottom scrim */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full mx-auto max-w-7xl px-4 sm:px-10 lg:px-16 flex flex-col justify-center h-full">
        <div className="max-w-2xl pt-12 sm:pt-20 animate-slide-up">
          {/* Badge */}
          {badgeText && (
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-3.5 py-1 sm:px-4 sm:py-1.5 mb-4 sm:mb-6 w-fit">
              <span className="relative inline-flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase text-white/85">
                {badgeText}
              </span>
            </div>
          )}

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.025em] leading-[1.1] sm:leading-[1.05] text-white mb-3 sm:mb-4 drop-shadow-lg">
            {title}
          </h1>

          {/* Accent rule */}
          <div className="w-12 sm:w-16 h-[3px] bg-gradient-to-r from-brand-400 to-white/30 rounded-full mb-4 sm:mb-5" />

          {/* Subtitle */}
          <p className="text-xs sm:text-base text-slate-300/90 mb-6 sm:mb-8 max-w-md leading-relaxed font-light drop-shadow">
            {subtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <a
              href={ctaLink}
              className="inline-flex items-center justify-center gap-2.5 bg-white text-slate-950 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold hover:bg-slate-50 active:scale-95 transition-all shadow-xl hover:shadow-white/20 text-xs sm:text-sm tracking-wide"
            >
              <span>{ctaText}</span>
              <ArrowRight size={15} />
            </a>

            {secondaryCtaText && secondaryCtaLink && (
              <Link
                href={secondaryCtaLink}
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/25 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-all text-xs sm:text-sm active:scale-95"
              >
                <span>{secondaryCtaText}</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-1 text-white/40 animate-bounce-in pointer-events-none">
        <span className="text-[10px] uppercase tracking-widest font-medium">Scroll</span>
        <ChevronDown size={16} />
      </div>
    </section>
  );
}
