"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageItem {
  url: string;
}

export function ProductImageGallery({
  images,
  productName,
}: {
  images: ImageItem[];
  productName: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (images && images.length > 0) setActiveIdx(0);
  }, [images]);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[4/5] w-full rounded-3xl bg-slate-100 flex items-center justify-center text-slate-300 text-6xl select-none">
        👕
      </div>
    );
  }

  function switchTo(idx: number) {
    if (idx === activeIdx) return;
    setFading(true);
    setTimeout(() => {
      setActiveIdx(idx);
      setFading(false);
    }, 180);
  }

  const prev = () => switchTo((activeIdx - 1 + images.length) % images.length);
  const next = () => switchTo((activeIdx + 1) % images.length);

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-slate-50 border border-slate-100 shadow-card group">
        <Image
          src={images[activeIdx].url}
          alt={productName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className={`object-cover transition-all duration-300 ${fading ? "opacity-0 scale-[1.01]" : "opacity-100 scale-100"}`}
        />

        {/* Prev/Next arrows (only if multiple images) */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-white/90 shadow-md text-slate-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-white/90 shadow-md text-slate-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => switchTo(i)}
                aria-label={`Go to image ${i + 1}`}
                className={`rounded-full transition-all ${i === activeIdx ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => switchTo(i)}
              className={`relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all focus:outline-none ${
                activeIdx === i
                  ? "border-brand-600 ring-2 ring-brand-200 ring-offset-1"
                  : "border-transparent opacity-55 hover:opacity-100 hover:border-slate-300"
              }`}
            >
              <Image
                src={img.url}
                alt={`${productName} ${i + 1}`}
                fill
                sizes="80px"
                loading="lazy"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
