"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

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
  banners?: HeroBannerData[] | HeroBannerData | null;
  banner?: HeroBannerData | null;
  autoPlayInterval?: number;
}

export function HeroBanner({ banners: bannersProp, banner, autoPlayInterval = 4500 }: HeroBannerProps) {
  // Normalize banners input
  const bannerList: HeroBannerData[] = Array.isArray(bannersProp)
    ? bannersProp.filter((b) => b.is_active !== false)
    : bannersProp
    ? [bannersProp]
    : banner
    ? [banner]
    : [];

  const effectiveBanners: HeroBannerData[] =
    bannerList.length > 0
      ? bannerList
      : [
          {
            image_url: "/hero_banner.png",
            badge_text: "SPRING / SUMMER 2026 DROP",
            title: "Essentials, Elevated.",
            subtitle:
              "Discover our new collection of premium cotton t-shirts. Designed for everyday comfort, crafted to last a lifetime.",
            cta_text: "Shop Collection",
            cta_link: "#products",
            secondary_cta_text: "Explore Oversized",
            secondary_cta_link: "/category/oversized",
            overlay_opacity: 40,
            banner_height: "tall",
            image_fit: "cover",
          },
        ];

  const totalSlides = effectiveBanners.length;
  const isMulti = totalSlides > 1;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // 3-second auto-scroll timer
  useEffect(() => {
    if (!isMulti || isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [isMulti, isPaused, autoPlayInterval, nextSlide]);

  const currentBanner = effectiveBanners[currentIndex] || effectiveBanners[0];
  const imageUrl = currentBanner.image_url || "/hero_banner.png";
  const badgeText = currentBanner.badge_text ?? "SPRING / SUMMER 2026 DROP";
  const title = currentBanner.title || "Essentials, Elevated.";
  const subtitle =
    currentBanner.subtitle ||
    "Discover our new collection of premium cotton t-shirts. Designed for everyday comfort, crafted to last a lifetime.";
  const ctaText = currentBanner.cta_text || "Shop the Collection";
  const ctaLink = currentBanner.cta_link || "#products";
  const secondaryCtaText = currentBanner.secondary_cta_text;
  const secondaryCtaLink = currentBanner.secondary_cta_link;
  const opacity =
    typeof currentBanner.overlay_opacity === "number" ? currentBanner.overlay_opacity : 40;
  const imageFit = currentBanner.image_fit === "contain" ? "object-contain" : "object-cover";

  const height =
    currentBanner.banner_height === "screen"
      ? "h-screen max-h-[700px]"
      : currentBanner.banner_height === "standard"
      ? "h-[380px]"
      : "h-[520px]"; // tall (default)

  return (
    <section
      className={`relative w-full ${height} bg-slate-950 flex items-start overflow-hidden group/hero select-none`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background images stack with smooth crossfade */}
      <div className="absolute inset-0">
        {effectiveBanners.map((b, idx) => {
          const isActive = idx === currentIndex;
          const bgUrl = b.image_url || "/hero_banner.png";
          const fit = b.image_fit === "contain" ? "object-contain" : "object-cover";

          return (
            <div
              key={b.id || idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100 z-0" : "opacity-0 -z-10 pointer-events-none"
              }`}
            >
              <Image
                src={bgUrl}
                alt={b.title || "Banner"}
                fill
                priority={idx === 0}
                sizes="100vw"
                className={`w-full h-full ${fit} object-center transition-transform duration-7000 ease-out ${
                  isActive ? "scale-105" : "scale-100"
                }`}
                quality={85}
              />
            </div>
          );
        })}

        {/* Dynamic vignette */}
        <div
          className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-700"
          style={{ opacity: opacity / 100 }}
        />

        {/* Left-to-right gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/10 pointer-events-none" />

        {/* Bottom scrim */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full mx-auto max-w-7xl px-4 sm:px-10 lg:px-16 flex flex-col justify-center h-full">
        <div key={currentIndex} className="max-w-2xl pt-12 sm:pt-20 animate-slide-up">
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

      {/* ── Multi-Banner Navigation (Arrows & Indicators) ── */}
      {isMulti && (
        <>
          {/* Left Arrow */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/30 hover:bg-black/60 text-white/80 hover:text-white backdrop-blur-md border border-white/10 flex items-center justify-center transition-all opacity-0 group-hover/hero:opacity-100 hover:scale-110 active:scale-95 shadow-lg"
            aria-label="Previous banner slide"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Right Arrow */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/30 hover:bg-black/60 text-white/80 hover:text-white backdrop-blur-md border border-white/10 flex items-center justify-center transition-all opacity-0 group-hover/hero:opacity-100 hover:scale-110 active:scale-95 shadow-lg"
            aria-label="Next banner slide"
          >
            <ChevronRight size={20} />
          </button>

          {/* Slide Indicator Dots */}
          <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/35 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
            {effectiveBanners.map((_, dotIdx) => {
              const isActive = dotIdx === currentIndex;
              return (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => setCurrentIndex(dotIdx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? "w-6 bg-white shadow-xs"
                      : "w-2 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Go to slide ${dotIdx + 1}`}
                />
              );
            })}
          </div>
        </>
      )}

      {/* Static scroll indicator (when single banner) */}
      {!isMulti && (
        <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-1 text-white/40 animate-bounce-in pointer-events-none">
          <span className="text-[10px] uppercase tracking-widest font-medium">Scroll</span>
          <ChevronDown size={16} />
        </div>
      )}
    </section>
  );
}
