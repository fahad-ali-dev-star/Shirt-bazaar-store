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
import { CategoryView } from "./category-view";

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

      {/* Product Grid & Filters */}
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
          <CategoryView products={finalProducts} categoryTitle={categoryTitle} />
        )}
      </section>
    </main>
  );
}
