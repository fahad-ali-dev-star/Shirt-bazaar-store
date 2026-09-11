import { createPublicClient } from "@/lib/supabase/public";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ArrowLeft, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 3600;

type Props = {
  params: Promise<{ slug: string }>;
};

function formatCategoryTitle(slug: string) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = formatCategoryTitle(slug);
  return {
    title: `${title} | Premium Shirt Collection`,
    description: `Explore our premium collection of ${title.toLowerCase()} crafted from 100% combed cotton.`,
    openGraph: {
      title: `${title} Collection | Shirt Bazaar`,
      description: `Shop high quality ${title.toLowerCase()} with fast delivery and easy returns.`,
    },
  };
}

import { getCachedCategoryProducts } from "@/lib/supabase/cached-queries";

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const categoryTitle = formatCategoryTitle(slug);
  const finalProducts = await getCachedCategoryProducts(slug);

  return (
    <main className="animate-fade-in min-h-[70vh]">
      {/* Breadcrumbs */}
      <div className="mx-auto max-w-6xl px-4 py-3 sm:py-4 overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 whitespace-nowrap">
          <Link href="/" className="hover:text-brand-600 transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link href="/#products" className="hover:text-brand-600 transition-colors">Categories</Link>
          <ChevronRight size={12} />
          <span className="text-slate-700 font-semibold">{categoryTitle}</span>
        </nav>
      </div>

      {/* Header */}
      <section className="mx-auto max-w-6xl px-4 pt-4 sm:pt-6 pb-4 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-1 flex items-center gap-1.5">
              <Sparkles size={12} className="text-brand-500" />
              Category Collection
            </p>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              {categoryTitle}
            </h1>
            <p className="mt-1 text-slate-500 text-xs sm:text-sm">
              {finalProducts?.length ?? 0} premium product{finalProducts?.length !== 1 ? "s" : ""} available
            </p>
            <div className="mt-3 sm:mt-4 h-1 w-12 rounded-full bg-gradient-to-r from-brand-500 to-brand-300" />
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors self-start sm:self-auto"
          >
            <ArrowLeft size={13} />
            <span>All Collections</span>
          </Link>
        </div>
      </section>

      {/* Product Grid */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        {!finalProducts || finalProducts.length === 0 ? (
          <div className="card p-8 sm:p-16 text-center">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl sm:text-4xl mb-4">
              👕
            </div>
            <p className="font-semibold text-slate-800 mb-1 text-sm sm:text-base">No products found in &ldquo;{categoryTitle}&rdquo;</p>
            <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto">
              We are constantly updating our inventory. Check back soon or explore our other collections.
            </p>
            <Link
              href="/"
              className="btn-primary text-xs px-6 py-3"
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {finalProducts.map((p, idx) => {
              const images = Array.isArray(p.product_images) ? p.product_images : [];
              const cover = images.reduce<{ url: string; position: number } | null>(
                (best, image) =>
                  !best || image.position < best.position ? image : best,
                null
              );

              return (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  className="group flex flex-col animate-slide-up card-hover rounded-xl sm:rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                  style={{ animationDelay: `${idx * 50}ms` }}
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
                      <p className="mt-0.5 text-[11px] sm:text-xs text-slate-400 capitalize">{categoryTitle}</p>
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
    </main>
  );
}
