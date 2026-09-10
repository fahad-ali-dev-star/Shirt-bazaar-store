"use client";

import { useState } from "react";
import { Sparkles, X, Ruler, CheckCircle2 } from "lucide-react";

interface SizeAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  availableSizes: string[];
  onSelectSize?: (size: string) => void;
}

export function SizeAdvisorModal({
  isOpen,
  onClose,
  productName,
  availableSizes,
  onSelectSize,
}: SizeAdvisorModalProps) {
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [fitPreference, setFitPreference] = useState<"slim" | "regular" | "oversized">("regular");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    recommendedSize: string;
    confidenceScore: number;
    fitAnalysis: string;
  } | null>(null);

  if (!isOpen) return null;

  async function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/size-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heightCm: Number(heightCm),
          weightKg: Number(weightKg),
          fitPreference,
          productName,
          availableSizes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to calculate recommendation");
      }

      setResult(data.recommendation);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : null) || "Failed to get fit advice");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">AI Fit & Size Advisor</h2>
              <p className="text-xs text-slate-500">Personalized fitting powered by Gemini</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!result ? (
          <form onSubmit={handleCalculate} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Your Height (cm)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={100}
                  max={230}
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400">cm</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Your Weight (kg)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={30}
                  max={200}
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400">kg</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Preferred Fit Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["slim", "regular", "oversized"] as const).map((fit) => (
                  <button
                    key={fit}
                    type="button"
                    onClick={() => setFitPreference(fit)}
                    className={`rounded-xl py-2.5 text-xs font-semibold capitalize border transition-all ${
                      fitPreference === fit
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {fit}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Calculating Perfect Fit...
                </>
              ) : (
                <>
                  <Ruler className="h-4 w-4" /> Find My Recommended Size
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                Recommended Size
              </span>
              <div className="mt-2 text-4xl font-extrabold text-slate-900">
                {result.recommendedSize}
              </div>
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {result.confidenceScore}% Match Confidence
              </div>
              <p className="mt-4 text-xs text-slate-600 leading-relaxed">
                {result.fitAnalysis}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setResult(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Recalculate
              </button>
              {onSelectSize && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectSize(result.recommendedSize);
                    onClose();
                  }}
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  Select Size {result.recommendedSize}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
