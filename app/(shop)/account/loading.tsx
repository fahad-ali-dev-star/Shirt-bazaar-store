export default function AccountLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 animate-fade-in space-y-6">
      {/* Profile Card Skeleton */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-slate-100 shimmer" />
          <div className="space-y-2">
            <div className="h-5 w-40 rounded shimmer" />
            <div className="h-4 w-52 rounded shimmer" />
          </div>
        </div>
        <div className="h-9 w-24 rounded-xl shimmer" />
      </div>

      {/* Orders List Skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-36 rounded shimmer" />
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="h-4 w-32 rounded shimmer" />
              <div className="h-6 w-24 rounded-full shimmer" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-48 rounded shimmer" />
              <div className="h-4 w-32 rounded shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
