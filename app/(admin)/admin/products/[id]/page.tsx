"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { AdminProduct, ProductVariant } from "@/lib/supabase/types";
import {
  ArrowLeft,
  Sparkles,
  Upload,
  Trash2,
  Plus,
  Layers,
  Image as ImageIcon,
  DollarSign,
  Tag,
  ExternalLink,
} from "lucide-react";

type VariantDraft = Omit<Pick<ProductVariant, "id" | "size" | "color" | "sku" | "stock_qty" | "price_override">, "id"> & {
  id?: string;
};

type ProductDraft = Omit<AdminProduct, "base_price" | "product_variants"> & {
  base_price: number | string;
  product_variants: VariantDraft[];
};

const POPULAR_CATEGORIES = ["T-Shirts", "Casual Shirts", "Oxford Shirts", "Polos", "Formal Shirts", "Oversized Tees"];
const STANDARD_SIZES = ["S", "M", "L", "XL", "XXL"];

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<ProductDraft | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [uploading, setUploading] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data.product as ProductDraft);
        if (data.product?.product_images) {
          const sortedUrls = (data.product.product_images as Array<{ position: number; url: string }>)
            .sort((a, b) => a.position - b.position)
            .map((img) => img.url);
          setImages(sortedUrls);
        }
        if (data.product?.product_variants) {
          setVariants(data.product.product_variants);
        }
      })
      .catch(() => setError("Failed to load product"));
  }, [id]);

  function updateVariant(i: number, patch: Partial<VariantDraft>) {
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }

  function addVariant() {
    const currentColor = variants[0]?.color || "Black";
    setVariants((prev) => [
      ...prev,
      { size: "M", color: currentColor, sku: "", stock_qty: 10, price_override: null },
    ]);
  }

  function removeVariant(i: number) {
    if (variants.length <= 1) {
      setError("Product must have at least one variant.");
      return;
    }
    setVariants((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addStandardSizes() {
    const currentColor = variants[0]?.color || "Black";
    const existingSizes = new Set(variants.map((v) => v.size.trim().toUpperCase()));
    const toAdd = STANDARD_SIZES.filter((s) => !existingSizes.has(s.toUpperCase()));

    if (toAdd.length === 0) {
      setSuccessMsg("All standard sizes (S, M, L, XL, XXL) are already added.");
      setTimeout(() => setSuccessMsg(null), 3000);
      return;
    }

    const newVariants: VariantDraft[] = toAdd.map((size) => ({
      size,
      color: currentColor,
      sku: `${product?.slug || "SHIRT"}-${size}-${currentColor.slice(0, 3)}`.toUpperCase(),
      stock_qty: 10,
      price_override: null,
    }));

    setVariants((prev) => [...prev, ...newVariants]);
  }

  async function handleAiGenerate() {
    if (images.length === 0) {
      setError("Please upload at least one product photo first.");
      return;
    }
    setGeneratingAi(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/generate-ai-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: images[0] }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to generate AI details");
      }

      if (data.data && product) {
        setProduct({
          ...product,
          name: data.data.name || product.name,
          description: data.data.description || product.description,
          category: data.data.category || product.category,
        });
      }
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : null) || "AI generation failed");
    } finally {
      setGeneratingAi(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to upload image");
        }

        const data = await res.json();
        urls.push(data.url);
      }

      setImages((prev) => [...prev, ...urls]);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : null) || "Error uploading image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${product?.name}"? It will be hidden from the storefront.`)) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete product");
      }
      router.push("/admin/products");
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : null) || "Failed to delete product");
      setDeleting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          base_price: Number(product.base_price),
          category: product.category ? product.category.trim() : null,
          is_active: product.is_active,
          images,
          variants,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save changes");
      }

      setSuccessMsg("Product changes saved successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : null) || "Failed to update product");
    } finally {
      setSaving(false);
    }
  }

  if (!product) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-10">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 animate-pulse rounded-2xl" />
          <div className="h-64 bg-slate-200 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  const totalStockUnits = variants.reduce((sum, v) => sum + (Number(v.stock_qty) || 0), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{product.name}</h1>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  product.is_active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
                }`}
              >
                {product.is_active ? "Active" : "Draft"}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">/products/{product.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={`/products/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
            title="Preview on storefront"
          >
            <span>View on store</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </Link>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 disabled:opacity-50 transition shadow-xs"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition"
          >
            {saving ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
          ✓ {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Product Title <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={product.name}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none transition shadow-xs font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Description
                </label>
                {images.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAiGenerate}
                    disabled={generatingAi}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Auto-write with Gemini AI</span>
                  </button>
                )}
              </div>
              <textarea
                value={product.description ?? ""}
                onChange={(e) => setProduct({ ...product, description: e.target.value })}
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none transition shadow-xs leading-relaxed"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Media & Photos</h2>
              </div>
              <span className="text-xs text-slate-400">{images.length} photo{images.length === 1 ? "" : "s"}</span>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((url, i) => (
                  <div
                    key={i}
                    className="relative group aspect-square rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shadow-xs"
                  >
                    <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="(max-width: 640px) 50vw, 25vw" unoptimized />
                    {i === 0 && (
                      <span className="absolute left-2 top-2 rounded bg-black/80 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                        Cover
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-slate-600 opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white transition shadow-sm"
                      title="Remove image"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-400 p-6 text-center transition bg-slate-50/50">
              <Upload className="mx-auto h-8 w-8 text-slate-400" />
              <div className="mt-2 text-xs text-slate-600 font-medium">
                <label className="cursor-pointer text-black hover:underline font-semibold">
                  <span>Upload images</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    disabled={uploading}
                    onChange={handleImageUpload}
                    className="sr-only"
                  />
                </label>
                <span className="text-slate-400"> or drag and drop</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
              {uploading && (
                <p className="mt-2 text-xs text-indigo-600 animate-pulse font-medium">Uploading to storage...</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Pricing</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Base Price (Rs PKR) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">
                    Rs
                  </span>
                  <input
                    required
                    type="number"
                    min={0}
                    value={product.base_price}
                    onChange={(e) => setProduct({ ...product, base_price: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none transition shadow-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Apparel Variants</h2>
              </div>
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                Total Stock: {totalStockUnits} units
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-600">Quick Presets:</span>
              <button
                type="button"
                onClick={addStandardSizes}
                className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-black transition shadow-2xs"
              >
                + Add Missing Standard Sizes (S, M, L, XL, XXL)
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-wider">
                    <th className="py-2 px-2">Size</th>
                    <th className="py-2 px-2">Color</th>
                    <th className="py-2 px-2">SKU</th>
                    <th className="py-2 px-2">Stock Qty</th>
                    <th className="py-2 px-2">Price Override (Rs)</th>
                    <th className="py-2 px-1 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {variants.map((v, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-2">
                        <input
                          required
                          value={v.size}
                          onChange={(e) => updateVariant(i, { size: e.target.value })}
                          placeholder="M"
                          className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 focus:border-black focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        <input
                          required
                          value={v.color}
                          onChange={(e) => updateVariant(i, { color: e.target.value })}
                          placeholder="Black"
                          className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 focus:border-black focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        <input
                          value={v.sku}
                          onChange={(e) => updateVariant(i, { sku: e.target.value })}
                          placeholder="AUTO-SKU"
                          className="w-28 font-mono rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] text-slate-600 focus:border-black focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        <input
                          type="number"
                          min={0}
                          value={v.stock_qty}
                          onChange={(e) => updateVariant(i, { stock_qty: Number(e.target.value) })}
                          className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 font-semibold focus:border-black focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        <input
                          type="number"
                          min={0}
                          value={v.price_override ?? ""}
                          onChange={(e) =>
                            updateVariant(i, {
                              price_override: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                          placeholder={String(product.base_price) || "Base"}
                          className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 focus:border-black focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeVariant(i)}
                          className="p-1 text-slate-400 hover:text-red-600 transition"
                          title="Delete variant"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={addVariant}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-black pt-2"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add another variant</span>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Product Status</h2>
            <div className="space-y-2">
              <label
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                  product.is_active
                    ? "border-black bg-slate-50 ring-1 ring-black"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="status"
                    checked={product.is_active}
                    onChange={() => setProduct({ ...product, is_active: true })}
                    className="h-4 w-4 text-black focus:ring-black"
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Active</p>
                    <p className="text-[11px] text-slate-500">Visible on storefront</p>
                  </div>
                </div>
                <span className="h-2 w-2 rounded-full bg-green-500" />
              </label>

              <label
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                  !product.is_active
                    ? "border-black bg-slate-50 ring-1 ring-black"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="status"
                    checked={!product.is_active}
                    onChange={() => setProduct({ ...product, is_active: false })}
                    className="h-4 w-4 text-black focus:ring-black"
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Draft</p>
                    <p className="text-[11px] text-slate-500">Hidden from storefront</p>
                  </div>
                </div>
                <span className="h-2 w-2 rounded-full bg-slate-400" />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-slate-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Category & Tags</h2>
            </div>

            <div>
              <input
                value={product.category ?? ""}
                onChange={(e) => setProduct({ ...product, category: e.target.value })}
                placeholder="e.g. Oxford Shirts"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none transition"
              />

              <div className="mt-3 flex flex-wrap gap-1.5">
                {POPULAR_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setProduct({ ...product, category: cat })}
                    className={`rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                      product.category === cat
                        ? "bg-black text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-b from-indigo-50/50 to-white p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-indigo-700">
              <Sparkles className="h-4 w-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider">Shopify Magic (Gemini AI)</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Let Gemini AI analyze the product cover image to regenerate an engaging marketing title, description, and apparel category.
            </p>
            <button
              type="button"
              onClick={handleAiGenerate}
              disabled={generatingAi || images.length === 0}
              className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {generatingAi ? "Analyzing with Gemini..." : "✨ Regenerate with AI"}
            </button>
            {images.length === 0 && (
              <p className="text-[11px] text-slate-400 text-center">Upload at least 1 image to enable</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
