"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Star,
  CheckCircle2,
  ThumbsUp,
  MessageSquarePlus,
  X,
  Sparkles,
  Filter,
  ShieldCheck,
  Send,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface ReviewItem {
  id: string;
  author_name: string;
  rating: number;
  title: string | null;
  comment: string;
  is_verified_buyer: boolean;
  helpful_count: number;
  created_at: string;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  distribution: Record<number, number>;
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
  initialStats?: ReviewStats;
}

const QUICK_TAGS = [
  "✨ True to size",
  "🧵 Ultra soft fabric",
  "🎨 Vibrant color",
  "🚚 Fast delivery",
  "👌 Premium stitching",
  "💯 Highly recommend",
];

const RATING_LABELS: Record<number, string> = {
  1: "Terrible",
  2: "Poor",
  3: "Average",
  4: "Good",
  5: "Excellent",
};

export function ProductReviews({ productId, productName, initialStats }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats>(
    initialStats || {
      totalReviews: 0,
      averageRating: 5.0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    }
  );
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">("newest");
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());

  // Form states
  const [formRating, setFormRating] = useState<number>(5);
  const [formHoverRating, setFormHoverRating] = useState<number>(0);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formComment, setFormComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Fetch reviews on mount
  useEffect(() => {
    let isMounted = true;
    async function loadReviews() {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${productId}/reviews`);
        if (!res.ok) throw new Error("Failed to load reviews");
        const data = await res.json();
        if (isMounted) {
          setReviews(data.reviews || []);
          if (data.stats) {
            setStats(data.stats);
          }
        }
      } catch (err) {
        console.warn("Could not load reviews", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadReviews();

    // Autofill user info if logged in
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user && isMounted) {
        setFormEmail(data.user.email || "");
        if (data.user.user_metadata?.full_name) {
          setFormName(data.user.user_metadata.full_name);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  // Filter & sort reviews
  const filteredReviews = useMemo(() => {
    let list = [...reviews];

    if (selectedStarFilter !== null) {
      list = list.filter((r) => Math.round(r.rating) === selectedStarFilter);
    }

    if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "highest") {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "lowest") {
      list.sort((a, b) => a.rating - b.rating);
    }

    return list;
  }, [reviews, selectedStarFilter, sortBy]);

  function handleAddTag(tag: string) {
    const cleanTag = tag.replace(/^[^\w\s]+/, "").trim();
    if (formComment.includes(cleanTag)) return;
    setFormComment((prev) => (prev ? `${prev}. ${cleanTag}` : cleanTag));
  }

  function handleToggleHelpful(reviewId: string) {
    setLikedReviews((prev) => {
      const next = new Set(prev);
      const isLiked = next.has(reviewId);
      if (isLiked) {
        next.delete(reviewId);
      } else {
        next.add(reviewId);
      }
      return next;
    });

    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          const delta = likedReviews.has(reviewId) ? -1 : 1;
          return { ...r, helpful_count: Math.max(0, (r.helpful_count || 0) + delta) };
        }
        return r;
      })
    );
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    if (!formName.trim()) {
      setFormError("Please enter your name.");
      setSubmitting(false);
      return;
    }

    if (!formComment.trim() || formComment.trim().length < 5) {
      setFormError("Please write at least a short comment (5+ characters).");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_name: formName.trim(),
          author_email: formEmail.trim() || null,
          rating: formRating,
          title: formTitle.trim() || null,
          comment: formComment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      if (data.review) {
        const newReview: ReviewItem = data.review;
        setReviews((prev) => [newReview, ...prev]);

        // Update stats
        setStats((prev) => {
          const newTotal = prev.totalReviews + 1;
          const star = Math.min(5, Math.max(1, formRating));
          const newDist = {
            ...prev.distribution,
            [star]: (prev.distribution[star] || 0) + 1,
          };
          let sum = 0;
          for (let s = 1; s <= 5; s++) {
            sum += s * (newDist[s] || 0);
          }
          return {
            totalReviews: newTotal,
            averageRating: Number((sum / newTotal).toFixed(1)),
            distribution: newDist,
          };
        });
      }

      setFormSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess(false);
        setFormTitle("");
        setFormComment("");
        setFormRating(5);
      }, 1500);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error submitting review");
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(isoString: string) {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recent";
    }
  }

  return (
    <section id="reviews" className="border-t border-slate-200 bg-slate-50/50 py-12 sm:py-16 scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4">
        {/* Section Heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-1 flex items-center gap-1.5">
              <Sparkles size={12} className="text-brand-500" />
              Customer Feedback
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Ratings & Reviews
            </h2>
            <p className="mt-1 text-slate-500 text-xs sm:text-sm">
              Real feedback from customers who purchased {productName}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn-primary text-xs sm:text-sm px-5 py-2.5 flex items-center gap-2 self-start sm:self-auto shadow-sm active:scale-95 transition-transform"
          >
            <MessageSquarePlus size={16} />
            <span>Write a Review</span>
          </button>
        </div>

        {/* ── Summary Card & Star Distribution ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-8 shadow-xs mb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center">
            {/* Score & Stars */}
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-slate-100">
              <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight">
                {stats.totalReviews > 0 ? stats.averageRating : "5.0"}
              </span>
              <div className="flex items-center gap-1 mt-2 mb-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={20}
                    className={
                      star <= Math.round(stats.totalReviews > 0 ? stats.averageRating : 5)
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-200 fill-slate-100"
                    }
                  />
                ))}
              </div>
              <p className="text-xs font-semibold text-slate-500">
                Based on {stats.totalReviews} customer {stats.totalReviews === 1 ? "review" : "reviews"}
              </p>
            </div>

            {/* Breakdown Bars */}
            <div className="md:col-span-8 space-y-2.5">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = stats.distribution[stars] || 0;
                const pct = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : stars === 5 ? 100 : 0;
                const isSelected = selectedStarFilter === stars;

                return (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => setSelectedStarFilter(isSelected ? null : stars)}
                    className={`w-full flex items-center gap-3 text-xs group text-left rounded-lg px-2 py-1 transition ${
                      isSelected ? "bg-brand-50/80 ring-1 ring-brand-300" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-1 w-12 shrink-0 font-semibold text-slate-700">
                      <span>{stars}</span>
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                    </div>

                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <span className="w-14 text-right text-slate-400 font-medium shrink-0">
                      {pct}% ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Filter & Sort Bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <button
              type="button"
              onClick={() => setSelectedStarFilter(null)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition shrink-0 ${
                selectedStarFilter === null
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              All ({reviews.length})
            </button>
            {[5, 4, 3, 2, 1].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedStarFilter(selectedStarFilter === s ? null : s)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1 shrink-0 ${
                  selectedStarFilter === s
                    ? "bg-brand-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>{s}</span>
                <Star size={11} className={selectedStarFilter === s ? "fill-white" : "text-amber-400 fill-amber-400"} />
                <span className="opacity-75">({stats.distribution[s] || 0})</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Filter size={13} /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="newest">Most Recent</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>

        {/* ── Reviews List ── */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse space-y-3">
                <div className="h-4 bg-slate-100 rounded w-1/4" />
                <div className="h-3 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 sm:p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center text-xl mb-3">
              ⭐
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {selectedStarFilter !== null
                ? `No ${selectedStarFilter}-star reviews found`
                : "No reviews yet"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
              {selectedStarFilter !== null
                ? "Try clearing the star filter to see all reviews."
                : `Be the first to review ${productName} and share your experience with other shoppers!`}
            </p>
            {selectedStarFilter !== null ? (
              <button
                type="button"
                onClick={() => setSelectedStarFilter(null)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Clear Filter
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="btn-primary text-xs px-5 py-2.5"
              >
                Write First Review
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReviews.map((review) => {
              const initials = review.author_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "U";
              const isHelpful = likedReviews.has(review.id);

              return (
                <div
                  key={review.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                          {initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs sm:text-sm font-bold text-slate-900">
                              {review.author_name}
                            </p>
                            {review.is_verified_buyer && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={10} className="text-emerald-600" />
                                Verified Buyer
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {formatDate(review.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={13}
                            className={
                              s <= review.rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-200 fill-slate-100"
                            }
                          />
                        ))}
                      </div>
                    </div>

                    {/* Review Title */}
                    {review.title && (
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
                        {review.title}
                      </h4>
                    )}

                    {/* Comment */}
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line mb-4">
                      {review.comment}
                    </p>
                  </div>

                  {/* Footer / Helpful Button */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[11px]">Was this review helpful?</span>
                    <button
                      type="button"
                      onClick={() => handleToggleHelpful(review.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        isHelpful
                          ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200"
                          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <ThumbsUp size={12} className={isHelpful ? "fill-brand-600 text-brand-600" : ""} />
                      <span>{review.helpful_count || 0}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Write Review Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div
            className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 sm:p-7 relative animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X size={18} />
            </button>

            {formSuccess ? (
              <div className="text-center py-10 space-y-3 animate-scale-in">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Thank You!</h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
                  Your review has been submitted successfully and published for {productName}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Write a Review</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Share your experience with <span className="font-semibold text-slate-700">{productName}</span>
                  </p>
                </div>

                {formError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                    {formError}
                  </div>
                )}

                {/* Rating Star Picker */}
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-center">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Overall Rating <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = star <= (formHoverRating || formRating);
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setFormHoverRating(star)}
                          onMouseLeave={() => setFormHoverRating(0)}
                          onClick={() => setFormRating(star)}
                          className="p-1 text-slate-300 transition-transform hover:scale-125 focus:outline-none"
                        >
                          <Star
                            size={28}
                            className={active ? "text-amber-400 fill-amber-400" : "text-slate-300"}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs font-semibold text-amber-600 mt-1">
                    {RATING_LABELS[formHoverRating || formRating]} ({formHoverRating || formRating} of 5 Stars)
                  </p>
                </div>

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      maxLength={60}
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Ali Khan"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address <span className="text-[10px] text-slate-400">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="ali@example.com"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Review Headline / Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Review Title <span className="text-[10px] text-slate-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Great quality shirt & super fast delivery!"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                {/* Comment */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Your Review <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">{formComment.length}/2000</span>
                  </div>
                  <textarea
                    required
                    rows={4}
                    maxLength={2000}
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    placeholder="What did you like or dislike about the fit, material, comfort, or style?"
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Quick Tag Suggestions */}
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Quick Suggestions:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddTag(tag)}
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn-secondary text-xs px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary text-xs px-6 py-2.5 flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <svg className="h-3.5 w-3.5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        <span>Submit Review</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
