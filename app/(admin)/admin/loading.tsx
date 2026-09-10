export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-xl shimmer" />
          <div className="h-4 w-96 rounded-lg shimmer" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-28 rounded-xl shimmer" />
          <div className="h-9 w-36 rounded-xl shimmer" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
            <div className="flex justify-between">
              <div className="h-4 w-24 rounded shimmer" />
              <div className="h-8 w-8 rounded-xl shimmer" />
            </div>
            <div className="h-8 w-32 rounded-xl shimmer" />
            <div className="h-3 w-28 rounded shimmer" />
          </div>
        ))}
      </div>

      {/* Charts & Pipeline Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs h-72 shimmer" />
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs h-72 shimmer" />
      </div>
    </div>
  );
}
