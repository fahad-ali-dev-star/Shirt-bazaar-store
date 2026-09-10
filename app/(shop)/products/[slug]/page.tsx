import { createPublicClient } from "@/lib/supabase/public";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ShieldCheck, RotateCcw, Truck, Star, Sparkles } from "lucide-react";
import { AddToCartForm } from "./add-to-cart-form";
import { ProductImageGallery } from "./gallery";
import type { Metadata } from "next";

export const revalidate = 3600;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createPublicClient();

  const { data: product } = await supabase
    .from("products")
    .select("name, description, base_price, product_images(url, position)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!product) {
    return { title: "Product Not Found | Shirt Bazaar" };
  }

  const rawImages = (Array.isArray(product.product_images) ? product.product_images : []) as {
    url: string;
    position: number;
  }[];
  const sortedImages = rawImages.slice().sort((a, b) => a.position - b.position);
  const coverImage = sortedImages[0]?.url;

  return {
    title: `${product.name} | Premium Shirt Bazaar`,
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
  const supabase = createPublicClient();

  const { data: product } = await supabase
    .from("products")
    .select(
      "id, name, slug, description, category, base_price, product_images(url, position), product_variants(id, size, color, stock_qty, price_override)"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

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

  // Fetch related products (same category or recent drops)
  let relatedQuery = supabase
    .from("products")
    .select("id, name, slug, base_price, category, product_images(url, position)")
    .eq("is_active", true)
    .neq("id", product.id)
    .limit(4);

  if (product.category) {
    relatedQuery = relatedQuery.eq("category", product.category);
  }

  const { data: relatedProducts } = await relatedQuery;

  return (
    <main className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-6xl px-4 py-4">
        <nav className="flex items-center gap-1.5 text-xs text-slate-400">
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
          <span className="text-slate-600 font-medium truncate max-w-xs">{product.name}</span>
        </nav>
      </div>

      {/* Main grid */}
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:gap-16">

          {/* ── Left: Gallery ── */}
          <div className="animate-slide-up">
            <ProductImageGallery images={images ?? []} productName={product.name} />
          </div>

          {/* ── Right: Info + Buy-box ── */}
          <div className="flex flex-col animate-slide-up" style={{ animationDelay: "80ms" }}>
            {/* Title + stock badge */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                {product.name}
              </h1>
              {totalStock > 0 ? (
                <span className="shrink-0 mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  In Stock
                </span>
              ) : (
                <span className="shrink-0 mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Rating placeholder */}
            <div className="flex items-center gap-1.5 mt-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={14} className={i <= 4 ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"} />
              ))}
              <span className="text-xs text-slate-500 ml-1">4.0 · 24 reviews</span>
            </div>

            {/* Price */}
            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-950">Rs {product.base_price}</span>
              <span className="text-sm text-slate-400 font-medium">/ piece</span>
            </div>

            {/* Divider */}
            <div className="my-6 h-px bg-slate-100" />

            {/* Description */}
            {product.description && (
              <p className="text-slate-600 leading-relaxed text-[15px] mb-6">
                {product.description}
              </p>
            )}

            {/* Add to cart */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <AddToCartForm
                productName={product.name}
                basePrice={product.base_price}
                variants={rawVariants}
                image={images?.[0]?.url}
              />
            </div>

            {/* Trust badges */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { icon: <Star size={16} className="text-amber-500" />, title: "Premium Quality", desc: "100% combed cotton" },
                { icon: <ShieldCheck size={16} className="text-brand-500" />, title: "Secure Checkout", desc: "SSL encrypted" },
                { icon: <Truck size={16} className="text-brand-500" />, title: "Fast Shipping", desc: "3–5 business days" },
                { icon: <RotateCcw size={16} className="text-brand-500" />, title: "Easy Returns", desc: "Hassle-free policy" },
              ].map((b) => (
                <div key={b.title} className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-100">
                  <div className="mt-0.5 shrink-0">{b.icon}</div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{b.title}</p>
                    <p className="text-[11px] text-slate-500">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Related Products ("You May Also Like") ── */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="border-t border-slate-200 bg-white py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-1 flex items-center gap-1.5">
                  <Sparkles size={12} />
                  Curated For You
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
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

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {relatedProducts.map((p, idx) => {
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
                    className="group flex flex-col card-hover rounded-2xl overflow-hidden bg-slate-50 border border-slate-100"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
                      {relCover ? (
                        <Image
                          src={relCover.url}
                          alt={p.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl text-slate-200">
                          👕
                        </div>
                      )}
                    </div>
                    <div className="p-3 sm:p-4 bg-white border-t border-slate-100 flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                          {p.name}
                        </h3>
                        <p className="mt-0.5 text-[11px] text-slate-400 capitalize">
                          {p.category || "Premium Cotton"}
                        </p>
                      </div>
                      <p className="font-bold text-xs sm:text-sm text-slate-900 shrink-0">
                        Rs {p.base_price}
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
