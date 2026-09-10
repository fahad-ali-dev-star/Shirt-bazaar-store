"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Sparkles, X, ArrowRight, Tag } from "lucide-react";

interface SearchResultItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  category: string;
  similarity?: number;
  image_url?: string;
}

export function AISearchBar() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[] | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/search/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setResults(data.results || []);
      }
    } catch (err) {
      console.error("AI Search failed", err);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setIsOpen(false);
    setResults(null);
    setQuery("");
  }

  return (
    <div className="relative w-full max-w-lg">
      <div
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-sm text-slate-500 hover:border-indigo-300 hover:bg-white transition-all cursor-pointer shadow-sm"
      >
        <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
        <span className="flex-1 truncate">Search shirts by vibe, style, or occasion...</span>
        <kbd className="hidden sm:inline-block rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
          AI Search
        </kbd>
      </div>

      {/* Modal / Expanded Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl transition-all border border-slate-100">
            {/* Input Header */}
            <form onSubmit={handleSearch} className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try 'oversized vintage graphic tee' or 'crisp white formal shirt'..."
                autoFocus
                className="flex-1 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {loading ? (
                <svg className="h-5 w-5 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setResults(null);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )
              )}
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </form>

            {/* Content area */}
            <div className="max-h-[60vh] overflow-y-auto p-5">
              {!results && !loading && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Suggested AI Searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Vintage oversized t-shirt",
                      "Formal white oxford shirt",
                      "Casual summer linen shirt",
                      "Dark streetwear graphic tee",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setQuery(suggestion);
                          fetch("/api/search/ai", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ query: suggestion }),
                          })
                            .then((res) => res.json())
                            .then((d) => setResults(d.results || []));
                        }}
                        className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 transition-all"
                      >
                        <Tag className="h-3 w-3 text-indigo-500" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {loading && (
                <div className="py-12 text-center">
                  <Sparkles className="mx-auto h-8 w-8 text-indigo-600 animate-spin mb-3" />
                  <p className="text-sm font-medium text-slate-700">Gemini is searching catalog for best matches...</p>
                </div>
              )}

              {results && results.length === 0 && !loading && (
                <div className="py-10 text-center">
                  <p className="text-sm text-slate-500">No matching shirts found for &quot;{query}&quot;.</p>
                </div>
              )}

              {results && results.length > 0 && !loading && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>AI Matched Results ({results.length})</span>
                    <span className="text-indigo-600 font-medium">Powered by Supabase pgvector</span>
                  </div>
                  {results.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      onClick={handleClose}
                      className="group flex items-center gap-4 rounded-2xl border border-slate-100 p-3 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all"
                    >
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            sizes="64px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                            {product.name}
                          </h4>
                          {product.category && (
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 capitalize">
                              {product.category}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {product.description}
                        </p>
                        <div className="mt-1 text-sm font-semibold text-slate-900">
                          Rs {Number(product.base_price).toLocaleString()}
                        </div>
                      </div>

                      <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
