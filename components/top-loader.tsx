"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function TopLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // When pathname or searchParams change, route transition is complete
  useEffect(() => {
    if (loading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, loading]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (loading) {
      setProgress(15);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          // Incremental easing
          const step = Math.max(1, (90 - prev) / 10);
          return Math.min(prev + step, 90);
        });
      }, 100);
    }

    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    // Intercept clicks on internal links to trigger immediate loading bar
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore external links, hash anchors on current page, downloads, and new tabs
      if (
        (href.startsWith("http") && !href.startsWith(window.location.origin)) ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        target.target === "_blank" ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // Check if it's an on-page hash scroll
      if (href.startsWith("#") || (href.startsWith("/#") && pathname === "/")) {
        return;
      }

      try {
        const url = new URL(href, window.location.href);
        if (url.pathname === pathname) {
          if (url.hash || url.search === (searchParams ? searchParams.toString() : "")) {
            return;
          }
        }
      } catch {
        return;
      }

      // Trigger immediate loading feedback
      setLoading(true);
      setProgress(10);
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [pathname, searchParams]);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none" aria-hidden="true">
      {/* Top Gradient Progress Bar */}
      <div
        className="h-[3.5px] bg-gradient-to-r from-brand-600 via-indigo-500 to-purple-500 transition-all duration-300 ease-out shadow-[0_0_12px_rgba(99,102,241,0.85)]"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />

      {/* Floating Center Subtle Loading Pill */}
      {loading && progress < 100 && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-white shadow-xl border border-slate-700/60 animate-fade-in">
          <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
          <span>Opening page…</span>
        </div>
      )}
    </div>
  );
}

export function TopLoader() {
  return (
    <Suspense fallback={null}>
      <TopLoaderInner />
    </Suspense>
  );
}
