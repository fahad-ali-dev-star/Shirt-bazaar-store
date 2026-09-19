"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function AdminLoginForm() {
  const [activeTab, setActiveTab] = useState<"magic" | "password">("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "unauthorized") {
      setError("Access denied. Only authorized administrator emails are permitted.");
    } else if (errorParam === "auth_failed") {
      setError("Authentication failed. Please try again.");
    }
  }, [searchParams]);

  async function handleMagicLinkSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    setSent(false);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin/products`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setSent(true);
      }
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : null) || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);
    setSent(false);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin/products`,
          },
        });

        if (error) {
          setError(error.message);
        } else {
          if (data.session) {
            router.push("/admin/products");
          } else {
            setSent(true);
          }
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          setError(error.message);
        } else {
          router.push("/admin/products");
        }
      }
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : null) || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative w-full max-w-md">
      {/* Background Glows */}
      <div className="absolute -top-12 -left-12 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl"></div>
      <div className="absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-purple-600/20 blur-3xl"></div>

      {/* Card Wrapper */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Shield Header Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-7 w-7 animate-pulse"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>
        </div>

        <div className="mb-8 text-center">
          <h1 className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
            Admin Portal
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to manage your storefront and orders.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mb-6 grid grid-cols-2 rounded-lg bg-slate-950 p-1 border border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              setActiveTab("magic");
              setError(null);
              setSent(false);
            }}
            className={`flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold tracking-wide transition-all duration-200 ${
              activeTab === "magic"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-3.5 w-3.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 21L14.907 14M21 3L10.5 13.5M21 3L13.5 10.5M21 3L17 7"
              />
            </svg>
            Magic Link
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("password");
              setError(null);
              setSent(false);
            }}
            className={`flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold tracking-wide transition-all duration-200 ${
              activeTab === "password"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-3.5 w-3.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0V10.5m-3.5 1.5h16.5c1.104 0 2-.896 2-2V9.5c0-1.104-.896-2-2-2H4.5c-1.104 0-2 .896-2 2V10c0 1.104.896 2 2 2z"
              />
            </svg>
            Password
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mb-6 flex gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5 shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <div>{error}</div>
          </div>
        )}

        {sent && (
          <div className="mb-6 flex gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-400 animate-fade-in">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5 shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
              />
            </svg>
            <div>
              <p className="font-semibold mb-0.5">{isSignUp ? "Account confirmation sent!" : "Magic link sent!"}</p>
              <p className="text-emerald-500/80">
                Check <strong>{email}</strong> for a {isSignUp ? "confirmation" : "sign-in"} link. Only emails listed in ADMIN_EMAILS will have access.
              </p>
            </div>
          </div>
        )}

        {/* Auth Forms */}
        {activeTab === "magic" ? (
          <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
            <div>
              <label htmlFor="magic-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="magic-email"
                  required
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  suppressHydrationWarning
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-4.5 w-4.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 py-3 text-sm font-semibold tracking-wide text-white transition-all duration-200 hover:from-indigo-600 hover:to-purple-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending Magic Link...
                </span>
              ) : (
                "Send Magic Link"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="password-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="password-email"
                  required
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  suppressHydrationWarning
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-4.5 w-4.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="password-field" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password-field"
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  suppressHydrationWarning
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-3 pl-10 pr-10 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-4.5 w-4.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0V10.5m-3.5 1.5h16.5c.9 0 1.604.543 1.848 1.302l1.25 3.875A1.5 1.5 0 0118.665 19.5H5.335a1.5 1.5 0 01-1.433-1.073l-1.25-3.875A1.996 1.996 0 014.5 12h12z"
                    />
                  </svg>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-4.5 w-4.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.808 7.808L21 21m-2.258-2.258l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-4.5 w-4.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 py-3 text-sm font-semibold tracking-wide text-white transition-all duration-200 hover:from-indigo-600 hover:to-purple-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isSignUp ? "Registering..." : "Signing In..."}
                </span>
              ) : (
                isSignUp ? "Sign Up" : "Sign In"
              )}
            </button>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setSent(false);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="relative flex min-h-[calc(100vh-53px)] w-full items-center justify-center overflow-hidden bg-slate-950 px-4 py-16">
      {/* Abstract Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35"></div>

      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center text-slate-400">
            <svg className="h-10 w-10 animate-spin text-indigo-500 mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm font-medium tracking-wide">Loading portal...</p>
          </div>
        }
      >
        <AdminLoginForm />
      </Suspense>
    </main>
  );
}
