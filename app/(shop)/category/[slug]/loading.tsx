export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12 animate-fade-in space-y-8">
      {/* Category Header Skeleton */}
      <div className="space-y-3 max-w-xl">
        <div className="flex items-center gap-2">
          <div className="h-4 w-12 rounded shimmer" />
          <span className="text-slate-300">/</span>
          <div className="h-4 w-24 rounded shimmer" />
        </div>
        <div className="h-9 sm:h-11 w-64 rounded-xl shimmer" />
        <div className="h-4 w-80 rounded shimmer" />
      </div>

      {/* Product Cards Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-xs space-y-3 overflow-hidden"
          >
            {/* Image Placeholder */}
            <div className="aspect-[4/5] w-full rounded-xl bg-slate-100 shimmer" />

            {/* Content Placeholder */}
            <div className="space-y-2 pt-1">
              <div className="h-3 w-16 rounded shimmer" />
              <div className="h-4 w-full rounded shimmer" />
              <div className="flex items-center justify-between pt-1">
                <div className="h-4 w-20 rounded shimmer" />
                <div className="h-3 w-12 rounded shimmer" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
