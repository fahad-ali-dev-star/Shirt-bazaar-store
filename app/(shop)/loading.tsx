export default function ShopLoading() {
  return (
    <div className="space-y-12 animate-fade-in pb-16">
      {/* Hero Banner Skeleton */}
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:pt-6">
        <div className="h-[420px] sm:h-[560px] w-full rounded-3xl bg-slate-200/80 shimmer flex flex-col justify-end p-6 sm:p-12 space-y-4">
          <div className="h-6 w-36 rounded-full bg-slate-300 shimmer" />
          <div className="h-10 sm:h-14 w-2/3 rounded-2xl bg-slate-300 shimmer" />
          <div className="h-4 sm:h-5 w-1/2 rounded-xl bg-slate-300 shimmer" />
          <div className="flex gap-3 pt-2">
            <div className="h-11 w-36 rounded-full bg-slate-300 shimmer" />
            <div className="h-11 w-36 rounded-full bg-slate-300 shimmer" />
          </div>
        </div>
      </div>

      {/* Catalog Grid Skeleton */}
      <div className="mx-auto max-w-7xl px-4 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 rounded-xl shimmer" />
            <div className="h-4 w-72 rounded-lg shimmer" />
          </div>
          {/* Category pills skeleton */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[1, 2, 3, 4, 5].map((c) => (
              <div key={c} className="h-8 w-24 rounded-full shimmer shrink-0" />
            ))}
          </div>
        </div>

        {/* 8 Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-xs space-y-3 overflow-hidden"
            >
              <div className="aspect-[4/5] w-full rounded-xl bg-slate-100 shimmer" />
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
    </div>
  );
}
