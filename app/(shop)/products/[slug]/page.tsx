import { createPublicClient } from "@/lib/supabase/public";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ShieldCheck, RotateCcw, Truck, Star, Sparkles } from "lucide-react";
import { AddToCartForm } from "./add-to-cart-form";
import { ProductImageGallery } from "./gallery";
import { WishlistButton } from "@/components/wishlist-button";
import { ProductReviews } from "@/components/reviews/product-reviews";
import type { Metadata } from "next";

import { getCachedProductBySlug, getCachedHomeProducts } from "@/lib/supabase/cached-queries";

export const revalidate = 3600;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCachedProductBySlug(slug);

  if (!product) {
    return { title: "Product Not Found | FHD Store" };
  }

  const rawImages = (Array.isArray(product.product_images) ? product.product_images : []) as {
    url: string;
    position: number;
  }[];
  const sortedImages = rawImages.slice().sort((a, b) => a.position - b.position);
  const coverImage = sortedImages[0]?.url;

  return {
    title: `${product.name} | Premium FHD Store`,
    description:
      product.description ||
      `Buy ${product.name} for Rs ${product.base_price}. Crafted from 100% premium combed cotton.`,
    openGraph: {
      title: `${product.name} - Rs ${product.base_price}`,
      description: product.description || "Premium quality shirts with fast nationwide delivery.",
      images: coverImage ? [{ url: coverImage, alt: product.name }] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getCachedProductBySlug(slug);

  if (!product) return notFound();

  const rawImages = (Array.isArray(product.product_images) ? product.product_images : []) as {
    url: string;
    position: number;
  }[];
  const images = rawImages.slice().sort((a, b) => a.position - b.position);
  const rawVariants = (Array.isArray(product.product_variants) ? product.product_variants : []) as {
    id: string;
    size: string;
    color: string;
    stock_qty: number;
    price_override: number | null;
  }[];
  const totalStock = rawVariants.reduce((s, v) => s + v.stock_qty, 0);

  // Fetch related products (from cached catalog for instant speed)
  const allHomeProducts = await getCachedHomeProducts();
  const relatedProducts = allHomeProducts.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <main className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-6xl px-4 py-3 sm:py-4 overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 whitespace-nowrap">
          <Link href="/" className="hover:text-brand-600 transition-colors">Home</Link>
          <ChevronRight size={12} />
          {product.category ? (
            <>
              <Link
                href={`/category/${product.category.toLowerCase().replace(/\s+/g, "-")}`}
                className="hover:text-brand-600 transition-colors capitalize"
              >
                {product.category}
              </Link>
              <ChevronRight size={12} />
            </>
          ) : (
            <>
              <Link href="/#products" className="hover:text-brand-600 transition-colors">Products</Link>
              <ChevronRight size={12} />
            </>
          )}
          <span className="text-slate-700 font-semibold truncate max-w-xs">{product.name}</span>
        </nav>
      </div>

      {/* Main grid */}
      <div className="mx-auto max-w-6xl px-4 pb-12 sm:pb-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-14 items-start">

          {/* ── Left: Gallery ── */}
          <div className="animate-slide-up">
            <ProductImageGallery images={images ?? []} productName={product.name} />
          </div>

          {/* ── Right: Info + Buy-box ── */}
          <div className="flex flex-col animate-slide-up" style={{ animationDelay: "80ms" }}>
            {/* Title + stock badge + Wishlist */}
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight flex-1">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 shrink-0">
                <WishlistButton
                  item={{
                    productId: product.id,
                    name: product.name,
                    slug: product.slug,
                    basePrice: Number(product.base_price),
                    image: images?.[0]?.url,
                    category: product.category,
                  }}
                  size={20}
                  className="bg-slate-100 hover:bg-rose-50"
                />
                {totalStock > 0 ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    In Stock
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>

            {/* Customer Rating Indicator */}
            <a
              href="#reviews"
              className="flex items-center gap-1.5 mt-2.5 sm:mt-3 group cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <span className="text-xs text-slate-500 ml-1 font-medium group-hover:text-brand-600 transition-colors">
                Customer Reviews & Ratings ↓
              </span>
            </a>

            {/* Price */}
            <div className="mt-4 sm:mt-5 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-950">Rs {Number(product.base_price).toLocaleString()}</span>
              <span className="text-xs sm:text-sm text-slate-400 font-medium">/ piece</span>
            </div>

            {/* Divider */}
            <div className="my-5 sm:my-6 h-px bg-slate-100" />

            {/* Description */}
            {product.description && (
              <p className="text-slate-600 leading-relaxed text-sm sm:text-[15px] mb-5 sm:mb-6">
                {product.description}
              </p>
            )}

            {/* Add to cart */}
            <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-2xs">
              <AddToCartForm
                productName={product.name}
                basePrice={product.base_price}
                variants={rawVariants}
                image={images?.[0]?.url}
              />
            </div>

            {/* Trust badges */}
            <div className="mt-5 sm:mt-6 grid grid-cols-2 gap-2.5 sm:gap-3">
              {[
                { icon: <Star size={16} className="text-amber-500" />, title: "Premium Quality", desc: "100% combed cotton" },
                { icon: <ShieldCheck size={16} className="text-brand-500" />, title: "Secure Checkout", desc: "COD & JazzCash" },
                { icon: <Truck size={16} className="text-brand-500" />, title: "Fast Shipping", desc: "3–5 business days" },
                { icon: <RotateCcw size={16} className="text-brand-500" />, title: "Easy Returns", desc: "Hassle-free policy" },
              ].map((b) => (
                <div key={b.title} className="flex items-start gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
                  <div className="mt-0.5 shrink-0">{b.icon}</div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{b.title}</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 leading-snug">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Customer Reviews & Ratings ── */}
      <ProductReviews productId={product.id} productName={product.name} />

      {/* ── Related Products ("You May Also Like") ── */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="border-t border-slate-200 bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-6 sm:mb-8 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-1 flex items-center gap-1.5">
                  <Sparkles size={12} />
                  Curated For You
                </p>
                <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  You May Also Like
                </h2>
              </div>
              <Link
                href="/#products"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors hidden sm:block"
              >
                View All Products →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
              {relatedProducts.map((p) => {
                const relImages = (Array.isArray(p.product_images) ? p.product_images : []) as {
                  url: string;
                  position: number;
                }[];
                const relCover = relImages.reduce<{ url: string; position: number } | null>(
                  (best, image) => (!best || image.position < best.position ? image : best),
                  null
                );

                return (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    className="group flex flex-col card-hover rounded-xl sm:rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-xs"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
                      {relCover ? (
                        <Image
                          src={relCover.url}
                          alt={p.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl text-slate-200">
                          👕
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 sm:p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2">
                      <div className="min-w-0 w-full sm:w-auto">
                        <h3 className="font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                          {p.name}
                        </h3>
                        <p className="mt-0.5 text-[11px] text-slate-400 capitalize">
                          {p.category || "Premium Cotton"}
                        </p>
                      </div>
                      <p className="font-bold text-xs sm:text-sm text-slate-900 shrink-0 self-end sm:self-auto">
                        Rs {Number(p.base_price).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
