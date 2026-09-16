"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Download, X, Share2, PlusSquare, Sparkles, CheckCircle2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("FHD Store Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("FHD Store Service Worker registration failed:", err);
        });
    }

    // 2. Check if already installed as standalone PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    // 3. Check dismissal cool-off (e.g. 3 days)
    const dismissedAt = localStorage.getItem("fhd_pwa_dismissed_at");
    if (dismissedAt) {
      const daysSinceDismissal = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissal < 3) {
        return;
      }
    }

    // 4. Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 5. Android / Chromium install prompt interception
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Wait 3 seconds before showing for gentle UX
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // If iOS and not standalone, show prompt after delay
    if (isIosDevice && !isStandalone) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 4000);
      return () => clearTimeout(timer);
    }

    const handleAppInstalled = () => {
      setShowPrompt(false);
      setShowIOSGuide(false);
      setInstalled(true);
      localStorage.removeItem("fhd_pwa_dismissed_at");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback
      setShowIOSGuide(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error("PWA install error:", err);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSGuide(false);
    localStorage.setItem("fhd_pwa_dismissed_at", Date.now().toString());
  };

  if (installed || !showPrompt) return null;

  return (
    <>
      {/* ── Main Mobile Floating Install Card ── */}
      <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-6 duration-500">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 ring-1 ring-black/5">
          {/* Subtle brand glow accent */}
          <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-teal-400/20 blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-blue-600/10 blur-xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            aria-label="Dismiss installation prompt"
            className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition"
          >
            <X size={15} />
          </button>

          <div className="flex items-start gap-3.5 pr-6">
            {/* FHD Store App Icon */}
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-md p-1">
              <Image
                src="/icons/icon-192x192.png"
                alt="FHD Store App"
                width={56}
                height={56}
                className="h-full w-full object-contain rounded-xl"
              />
            </div>

            {/* App Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
                  FHD Store App
                </h4>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-teal-50 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700 border border-teal-200/60">
                  <Sparkles size={10} /> App
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-tight">
                Install for instant checkout & live order tracking.
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-3.5 flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition"
            >
              Not now
            </button>
            <button
              onClick={handleInstallClick}
              className="flex-[2] flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-500/20 hover:opacity-95 active:scale-98 transition cursor-pointer"
            >
              <Download size={14} />
              <span>Install FHD Store</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── iOS 3-Step Instruction Modal ── */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-8 duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Image
                  src="/icons/icon-192x192.png"
                  alt="FHD Store Icon"
                  width={36}
                  height={36}
                  className="rounded-xl shadow-sm"
                />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Install on iPhone / iPad
                  </h3>
                  <p className="text-[11px] text-slate-500">Add to your Home Screen</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="my-5 space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-bold">
                  1
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Tap the Share icon
                  </p>
                  <p className="mt-0.5 text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    Located in Safari&apos;s bottom toolbar <Share2 size={13} className="text-blue-600 inline" />
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400 font-bold">
                  2
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Tap &ldquo;Add to Home Screen&rdquo;
                  </p>
                  <p className="mt-0.5 text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    Scroll down and select <PlusSquare size={13} className="text-teal-600 inline" />
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 font-bold">
                  3
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Tap &ldquo;Add&rdquo; in top-right
                  </p>
                  <p className="mt-0.5 text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    FHD Store app will be ready on your homescreen! <CheckCircle2 size={13} className="text-emerald-600 inline" />
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIOSGuide(false);
                handleDismiss();
              }}
              className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
