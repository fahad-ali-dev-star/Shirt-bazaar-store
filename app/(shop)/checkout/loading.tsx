export default function CheckoutLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12 animate-fade-in space-y-8">
      {/* Progress Steps Skeleton */}
      <div className="flex justify-center">
        <div className="h-10 w-80 rounded-2xl shimmer" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Skeleton */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
          <div className="h-6 w-48 rounded shimmer" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-12 rounded-xl shimmer" />
            <div className="h-12 rounded-xl shimmer" />
          </div>
          <div className="h-12 rounded-xl shimmer" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-12 rounded-xl shimmer" />
            <div className="h-12 rounded-xl shimmer" />
          </div>
          <div className="h-12 w-full rounded-xl bg-slate-900/10 shimmer mt-4" />
        </div>

        {/* Right Column: Order Summary Skeleton */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4 h-fit">
          <div className="h-5 w-32 rounded shimmer" />
          <div className="space-y-3 pt-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex justify-between items-center py-2">
                <div className="h-4 w-36 rounded shimmer" />
                <div className="h-4 w-16 rounded shimmer" />
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-3 flex justify-between">
            <div className="h-5 w-20 rounded shimmer" />
            <div className="h-5 w-24 rounded shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
