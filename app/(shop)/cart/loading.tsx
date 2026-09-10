export default function CartLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12 animate-fade-in space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-2 border-b border-slate-200 pb-4">
        <div className="h-8 w-44 rounded-xl shimmer" />
        <div className="h-4 w-60 rounded shimmer" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Cart Items Skeleton */}
        <div className="lg:col-span-2 space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center gap-4"
            >
              <div className="h-20 w-20 rounded-xl bg-slate-100 shimmer shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded shimmer" />
                <div className="h-3 w-1/3 rounded shimmer" />
                <div className="h-4 w-20 rounded shimmer" />
              </div>
              <div className="h-9 w-24 rounded-xl shimmer shrink-0" />
            </div>
          ))}
        </div>

        {/* Right Column: Order Summary Skeleton */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4 h-fit">
          <div className="h-5 w-32 rounded shimmer" />
          <div className="space-y-3 pt-2">
            <div className="flex justify-between">
              <div className="h-4 w-20 rounded shimmer" />
              <div className="h-4 w-16 rounded shimmer" />
            </div>
            <div className="flex justify-between">
              <div className="h-4 w-24 rounded shimmer" />
              <div className="h-4 w-12 rounded shimmer" />
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3">
              <div className="h-5 w-16 rounded shimmer" />
              <div className="h-5 w-24 rounded shimmer" />
            </div>
          </div>
          <div className="h-12 w-full rounded-2xl bg-slate-200 shimmer mt-4" />
        </div>
      </div>
    </div>
  );
}
