import { getCachedBanner, getCachedHomeProducts, searchProducts } from "@/lib/supabase/cached-queries";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { HeroBanner } from "@/components/hero-banner";

export const revalidate = 60;

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function HomePage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const rawQ = typeof resolvedParams.q === "string" ? resolvedParams.q.trim() : "";
  const q = rawQ.length > 0 ? rawQ.slice(0, 80) : undefined;

  // Parallel cached fetch for instant response
  const [banner, products] = await Promise.all([
    getCachedBanner(),
    q ? searchProducts(q) : getCachedHomeProducts(),
  ]);

  return (
    <main className="w-full animate-fade-in">
      {/* Hero */}
      {!q && <HeroBanner banner={banner} />}

      {/* ── Section Header ── */}
      <section id="products" className="mx-auto max-w-6xl px-4 pt-12 sm:pt-20 pb-4 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            {q ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-1 sm:mb-2">Search Results</p>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Results for &ldquo;{q}&rdquo;
                </h2>
                <p className="mt-1 text-slate-500 text-xs sm:text-sm">{products?.length ?? 0} item(s) found</p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-1 sm:mb-2 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-brand-500" />
                  Fresh Drops
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">New Arrivals</h2>
                <p className="mt-1 text-slate-500 text-xs sm:text-sm">The latest additions to our premium lineup.</p>
              </>
            )}
            {/* Decorative accent */}
            <div className="mt-3 sm:mt-4 h-1 w-12 rounded-full bg-gradient-to-r from-brand-500 to-brand-300" />
          </div>

          {!q && (
            <Link
              href="/#products"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors self-start sm:self-auto"
            >
              View All <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {/* ── Category Quick Filter Pills ── */}
        {!q && (
          <div className="mt-5 sm:mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none flex-nowrap sm:flex-wrap">
            <Link
              href="/#products"
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-brand-600 text-white shadow-xs transition-transform active:scale-95 shrink-0"
            >
              All Drops
            </Link>
            {[
              { label: "T-Shirts", slug: "t-shirts" },
              { label: "Casual Shirts", slug: "casual-shirts" },
              { label: "Oxford Shirts", slug: "oxford-shirts" },
              { label: "Polos", slug: "polos" },
              { label: "Formal Shirts", slug: "formal-shirts" },
              { label: "Oversized Tees", slug: "oversized-tees" },
            ].map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white text-slate-600 border border-slate-200 hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50/50 transition-all active:scale-95 shrink-0 whitespace-nowrap"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Product Grid ── */}
      <section className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
        {!products?.length ? (
          <div className="card p-8 sm:p-16 text-center">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl sm:text-4xl mb-4">
              👕
            </div>
            <p className="text-slate-500 font-medium mb-1 text-sm sm:text-base">No products available right now.</p>
            <p className="text-xs text-slate-400 mb-6">Products added in the admin panel will appear here.</p>
            <Link
              href="/admin/products/new"
              className="btn-primary text-xs px-5 py-2.5"
            >
              Add Your First Product
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {products.map((p, idx) => {
              const images = Array.isArray(p.product_images) ? p.product_images : [];
              const cover = images.reduce(
                (best: (typeof images)[number] | null, image) =>
                  !best || image.position < best.position ? image : best,
                null
              );
              const isNew = idx < 4;

              return (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  className="group flex flex-col animate-slide-up card-hover rounded-xl sm:rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  {/* Image */}
                  <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
                    {cover ? (
                      <Image
                        src={cover.url}
                        alt={p.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl sm:text-5xl text-slate-200 select-none">
                        👕
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex flex-col gap-1.5">
                      {isNew && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider bg-brand-600 text-white shadow-xs">
                          NEW
                        </span>
                      )}
                    </div>

                    {/* Hover overlay (desktop only) */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block" />
                    <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hidden sm:block">
                      <div className="w-full bg-white/95 backdrop-blur-sm text-center py-2.5 rounded-xl text-xs font-semibold text-slate-900 shadow-sm">
                        View Details →
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-2.5 sm:p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2">
                    <div className="min-w-0 w-full sm:w-auto">
                      <h3 className="font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                        {p.name}
                      </h3>
                      <p className="mt-0.5 text-[11px] sm:text-xs text-slate-400">Premium Cotton</p>
                    </div>
                    <p className="font-bold text-xs sm:text-sm text-slate-900 shrink-0 self-end sm:self-auto">
                      Rs {Number(p.base_price).toLocaleString()}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Trust Bar ── */}
      {!q && (
        <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
          <div className="card p-5 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            {[
              { icon: "🧵", title: "Premium Cotton", desc: "100% combed ring-spun" },
              { icon: "🚚", title: "Fast Delivery", desc: "Nationwide in 3-5 days" },
              { icon: "🔒", title: "Secure Checkout", desc: "COD & JazzCash/Easypaisa" },
              { icon: "↩️", title: "Easy Returns", desc: "Hassle-free policy" },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center gap-1.5 sm:gap-2 p-2">
                <span className="text-2xl sm:text-3xl">{item.icon}</span>
                <p className="font-semibold text-xs sm:text-sm text-slate-900">{item.title}</p>
                <p className="text-[11px] sm:text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
