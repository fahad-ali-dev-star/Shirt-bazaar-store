export default function ProductDetailsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12 animate-fade-in">
      {/* Breadcrumb Skeleton */}
      <div className="mb-6 flex items-center gap-2">
        <div className="h-4 w-12 rounded-md shimmer" />
        <span className="text-slate-300">/</span>
        <div className="h-4 w-20 rounded-md shimmer" />
        <span className="text-slate-300">/</span>
        <div className="h-4 w-32 rounded-md shimmer" />
      </div>

      {/* Main Product Layout Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Left Column: Image Gallery Skeleton */}
        <div className="space-y-4">
          {/* Main big image */}
          <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-100 shimmer shadow-xs">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-slate-300">
                <span className="text-3xl animate-bounce">👕</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Loading High-Res Photos…</span>
              </div>
            </div>
          </div>

          {/* Thumbnails row */}
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 w-20 rounded-xl border border-slate-200 bg-slate-100 shimmer shrink-0"
              />
            ))}
          </div>
        </div>

        {/* Right Column: Product Info & Form Skeleton */}
        <div className="space-y-6">
          {/* Category & Badge */}
          <div className="flex items-center gap-2">
            <div className="h-6 w-24 rounded-full shimmer" />
            <div className="h-6 w-20 rounded-full shimmer" />
          </div>

          {/* Title & Price */}
          <div className="space-y-2">
            <div className="h-8 sm:h-10 w-4/5 rounded-xl shimmer" />
            <div className="h-6 w-36 rounded-lg shimmer" />
          </div>

          {/* Description placeholder */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="h-4 w-full rounded shimmer" />
            <div className="h-4 w-11/12 rounded shimmer" />
            <div className="h-4 w-3/4 rounded shimmer" />
          </div>

          {/* Color Selector Skeleton */}
          <div className="space-y-2.5 pt-2">
            <div className="h-4 w-28 rounded shimmer" />
            <div className="flex gap-2">
              {[1, 2, 3].map((c) => (
                <div key={c} className="h-9 w-20 rounded-xl shimmer" />
              ))}
            </div>
          </div>

          {/* Size Selector Skeleton */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded shimmer" />
              <div className="h-4 w-32 rounded shimmer" />
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className="h-11 rounded-xl shimmer" />
              ))}
            </div>
          </div>

          {/* Add to Cart Big Button Skeleton */}
          <div className="pt-4 space-y-3">
            <div className="h-13 w-full rounded-2xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 shimmer shadow-md" />
            <div className="h-11 w-full rounded-2xl shimmer" />
          </div>

          {/* Trust badges skeleton */}
          <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-slate-100">
            {[1, 2, 3, 4].map((t) => (
              <div key={t} className="h-12 rounded-xl border border-slate-100 bg-slate-50 shimmer" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
