"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Plus,
  Search,
  ExternalLink,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  Eye,
  EyeOff,
} from "lucide-react";

type ProductVariant = {
  id: string;
  size: string;
  color: string;
  sku: string;
  stock_qty: number;
  price_override?: number | null;
};

type ProductImage = {
  url: string;
  position: number;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  category: string | null;
  is_active: boolean;
  created_at?: string;
  product_variants: ProductVariant[];
  product_images?: ProductImage[];
};

type FilterTab = "all" | "active" | "draft" | "low_stock";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 401 ? "Not authorized" : "Failed to load");
        return res.json();
      })
      .then((data) => setProducts(data.products || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"? It will be hidden from your storefront.`)) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert("Failed to delete product");
      }
    } catch {
      alert("Error deleting product");
    }
  }

  async function handleToggleStatus(id: string, currentStatus: boolean) {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_active: !currentStatus } : p))
        );
      } else {
        alert("Failed to update status");
      }
    } catch {
      alert("Error updating status");
    } finally {
      setTogglingId(null);
    }
  }

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalStock = 0;
    let lowStockCount = 0;
    let activeCount = 0;

    for (const p of products) {
      if (p.is_active) activeCount++;
      const stock = p.product_variants?.reduce((sum, v) => sum + (v.stock_qty || 0), 0) ?? 0;
      totalStock += stock;
      if (stock <= 5) lowStockCount++;
    }

    return {
      totalProducts: products.length,
      activeCount,
      draftCount: products.length - activeCount,
      lowStockCount,
      totalStock,
    };
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const totalStock = p.product_variants?.reduce((sum, v) => sum + (v.stock_qty || 0), 0) ?? 0;

      // Tab filter
      if (activeTab === "active" && !p.is_active) return false;
      if (activeTab === "draft" && p.is_active) return false;
      if (activeTab === "low_stock" && totalStock > 5) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesCategory = (p.category ?? "").toLowerCase().includes(q);
        const matchesSku = p.product_variants?.some((v) => (v.sku ?? "").toLowerCase().includes(q));
        return matchesName || matchesCategory || matchesSku;
      }

      return true;
    });
  }, [products, activeTab, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 animate-pulse rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-semibold text-base">{error}</p>
        {error === "Not authorized" && (
          <p className="mt-1 text-sm text-red-600">
            Sign in with an authorized email configured in your ADMIN_EMAILS environment variable.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your shirt catalog, inventory stock levels, and pricing.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add product</span>
        </Link>
      </div>

      {/* KPI Metrics Summary Bar (Shopify Analytics Bar) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wider">
            <Package className="h-4 w-4 text-slate-400" />
            <span>Total Products</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1.5">{metrics.totalProducts}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-green-700 text-xs font-medium uppercase tracking-wider">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>Active Listings</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1.5">{metrics.activeCount}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-amber-700 text-xs font-medium uppercase tracking-wider">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>Low / Out of Stock</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1.5">{metrics.lowStockCount}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-blue-700 text-xs font-medium uppercase tracking-wider">
            <Boxes className="h-4 w-4 text-blue-600" />
            <span>Total Stock Units</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1.5">{metrics.totalStock.toLocaleString()}</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Filter Tabs & Search Header */}
        <div className="border-b border-slate-100 p-4 space-y-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-sm">
            <button
              onClick={() => setActiveTab("all")}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                activeTab === "all"
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              All ({metrics.totalProducts})
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                activeTab === "active"
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Active ({metrics.activeCount})
            </button>
            <button
              onClick={() => setActiveTab("draft")}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                activeTab === "draft"
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Drafts ({metrics.draftCount})
            </button>
            <button
              onClick={() => setActiveTab("low_stock")}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                activeTab === "low_stock"
                  ? "bg-amber-100 text-amber-900 font-semibold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Low / Out of Stock ({metrics.lowStockCount})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by title, category, or SKU..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:bg-white focus:outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-900">No products found</p>
            <p className="mt-1 text-xs text-slate-500">
              {searchQuery ? "Try changing your search query or active filter." : "Get started by adding your first product."}
            </p>
            {!searchQuery && (
              <Link
                href="/admin/products/new"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add product</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Inventory</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const sortedImages = (p.product_images ?? []).sort((a, b) => a.position - b.position);
                  const thumbnail = sortedImages[0]?.url;
                  const totalStock = p.product_variants?.reduce((sum, v) => sum + (v.stock_qty || 0), 0) ?? 0;
                  const variantCount = p.product_variants?.length ?? 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                      {/* Product Thumbnail & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 shrink-0 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center">
                            {thumbnail ? (
                              <Image src={thumbnail} alt={p.name} fill className="object-cover" sizes="48px" />
                            ) : (
                              <Package className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/admin/products/${p.id}`}
                              className="font-semibold text-slate-900 hover:text-black hover:underline"
                            >
                              {p.name}
                            </Link>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">/{p.slug}</p>
                          </div>
                        </div>
                      </td>

                      {/* Status & Quick Toggle */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          disabled={togglingId === p.id}
                          onClick={() => handleToggleStatus(p.id, p.is_active)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition cursor-pointer ${
                            p.is_active
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                          title="Click to toggle product visibility"
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              p.is_active ? "bg-green-600 animate-pulse" : "bg-slate-400"
                            }`}
                          />
                          {p.is_active ? "Active" : "Draft"}
                        </button>
                      </td>

                      {/* Inventory Stock Indicator */}
                      <td className="py-3 px-4">
                        <div>
                          <div className="flex items-center gap-1.5 font-medium text-slate-900">
                            <span>{totalStock} in stock</span>
                            {totalStock === 0 ? (
                              <span className="rounded bg-red-100 px-1.5 py-0.2 text-[10px] font-bold text-red-700">
                                OUT
                              </span>
                            ) : totalStock <= 5 ? (
                              <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-700">
                                LOW
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {variantCount} variant{variantCount === 1 ? "" : "s"}
                          </p>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 capitalize">
                          {p.category || "General"}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        Rs {Number(p.base_price).toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        <Link
                          href={`/products/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                          title="View on storefront"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>

                        <Link
                          href={`/admin/products/${p.id}`}
                          className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50 transition"
                          title="Edit product"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Link>

                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="inline-flex items-center justify-center p-1.5 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50 transition"
                          title="Delete product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
