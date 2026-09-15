"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Star,
  Search,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Filter,
  ShieldCheck,
  Sparkles,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

interface AdminReviewItem {
  id: string;
  product_id: string;
  user_id: string | null;
  author_name: string;
  author_email: string | null;
  rating: number;
  title: string | null;
  comment: string;
  is_verified_buyer: boolean;
  status: "approved" | "pending" | "rejected";
  helpful_count: number;
  created_at: string;
  products?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/reviews");
      if (!res.ok) throw new Error("Failed to load reviews");
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading reviews");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(reviewId: string, newStatus: "approved" | "pending" | "rejected") {
    try {
      setUpdatingId(reviewId);
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status: newStatus } : r))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(reviewId: string) {
    if (!window.confirm("Are you sure you want to permanently delete this review?")) return;

    try {
      setDeletingId(reviewId);
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete review");

      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  // Summary statistics
  const stats = useMemo(() => {
    const total = reviews.length;
    const approved = reviews.filter((r) => r.status === "approved").length;
    const verified = reviews.filter((r) => r.is_verified_buyer).length;
    const sumRating = reviews.reduce((s, r) => s + r.rating, 0);
    const avgRating = total > 0 ? (sumRating / total).toFixed(1) : "5.0";

    return { total, approved, verified, avgRating };
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.author_name.toLowerCase().includes(q);
        const matchesTitle = (r.title || "").toLowerCase().includes(q);
        const matchesComment = r.comment.toLowerCase().includes(q);
        const matchesProduct = (r.products?.name || "").toLowerCase().includes(q);
        if (!matchesName && !matchesTitle && !matchesComment && !matchesProduct) {
          return false;
        }
      }

      // Status
      if (statusFilter !== "all" && r.status !== statusFilter) {
        return false;
      }

      // Rating
      if (ratingFilter !== "all" && r.rating !== Number(ratingFilter)) {
        return false;
      }

      return true;
    });
  }, [reviews, searchQuery, statusFilter, ratingFilter]);

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recent";
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-brand-600" />
            <span>Product Reviews Moderation</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage, moderate, and inspect customer feedback across your entire shirt catalog
          </p>
        </div>

        <button
          onClick={loadReviews}
          className="btn-secondary text-xs px-3.5 py-2 self-start sm:self-auto"
        >
          Refresh Reviews
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700 flex items-center gap-2">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Reviews</span>
            <MessageSquare size={16} className="text-brand-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.total}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Average Rating</span>
            <Star size={16} className="text-amber-500 fill-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.avgRating} ★</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Approved Reviews</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{stats.approved}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Verified Buyers</span>
            <ShieldCheck size={16} className="text-indigo-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600">{stats.verified}</p>
        </div>
      </div>

      {/* ── Search & Filter Toolbar ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, product, title, or review text..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-black focus:bg-white focus:outline-none transition"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-black focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Rating Filter */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-black focus:outline-none"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* ── Reviews Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading reviews...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="text-3xl">💬</div>
            <p className="font-semibold text-slate-800 text-sm">No reviews found</p>
            <p className="text-xs text-slate-400">
              {searchQuery ? "Try clearing search filters." : "Customer reviews will appear here once submitted."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Rating & Review</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReviews.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Product */}
                    <td className="py-3.5 px-4">
                      {r.products ? (
                        <Link
                          href={`/products/${r.products.slug}`}
                          target="_blank"
                          className="font-bold text-slate-900 hover:text-brand-600 flex items-center gap-1 group line-clamp-1 max-w-[180px]"
                        >
                          <span>{r.products.name}</span>
                          <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 shrink-0" />
                        </Link>
                      ) : (
                        <span className="text-slate-400 italic">Deleted Product</span>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{r.author_name}</div>
                      {r.author_email && (
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                          {r.author_email}
                        </div>
                      )}
                      {r.is_verified_buyer && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200 mt-0.5">
                          <CheckCircle2 size={9} /> Verified Buyer
                        </span>
                      )}
                    </td>

                    {/* Rating & Review */}
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="flex items-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={11}
                            className={
                              s <= r.rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-200 fill-slate-100"
                            }
                          />
                        ))}
                        <span className="text-[10px] font-bold text-slate-600 ml-1">{r.rating}/5</span>
                      </div>
                      {r.title && <p className="font-bold text-slate-800 line-clamp-1">{r.title}</p>}
                      <p className="text-slate-600 text-[11px] line-clamp-2 leading-relaxed">
                        {r.comment}
                      </p>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-4">
                      <select
                        disabled={updatingId === r.id}
                        value={r.status}
                        onChange={(e) => handleStatusChange(r.id, e.target.value as any)}
                        className={`rounded-lg px-2 py-1 text-xs font-semibold border transition ${
                          r.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : r.status === "rejected"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {formatDate(r.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        disabled={deletingId === r.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete review"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
