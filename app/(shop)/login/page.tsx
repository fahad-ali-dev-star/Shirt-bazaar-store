"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("error") === "auth_failed") {
      setError("Authentication failed. Please try again.");
    }
  }, [searchParams]);

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError(null);

    const nextParam = searchParams.get("next");
    const destination = (nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//"))
      ? nextParam
      : "/account";

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destination)}`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        setError(error.message);
        setGoogleLoading(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect to Google";
      setError(msg);
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    setSent(false);

    const nextParam = searchParams.get("next");
    // Ensure relative redirect only (no open redirects)
    const destination = (nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//"))
      ? nextParam
      : "/account";

    try {
      const supabase = createClient();

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destination)}`,
          },
        });

        if (error) {
          setError(
            error.message.toLowerCase().includes("rate limit")
              ? "Too many attempts. Please wait a few minutes and try again."
              : error.message
          );
        } else {
          if (data.session) {
            router.push(destination);
            router.refresh();
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
          setError(
            error.message.toLowerCase().includes("rate limit")
              ? "Too many sign-in attempts. Please wait and try again."
              : error.message
          );
        } else {
          router.push(destination);
          router.refresh();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg.toLowerCase().includes("rate limit")
          ? "You are doing that too fast. Please wait a few minutes."
          : msg || "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-65px)] w-full">
      {/* ── Left: Brand Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-900 via-brand-700 to-indigo-500 relative overflow-hidden flex-col items-center justify-center p-12 text-white">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10 text-center max-w-sm">
          <p className="text-4xl font-extrabold tracking-tight mb-3">Shirt Bazaar.</p>
          <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-6" />
          <p className="text-white/70 leading-relaxed text-sm">
            Premium cotton essentials designed for everyday comfort. Sign in to track your orders and manage your account.
          </p>

          {/* Feature list */}
          <ul className="mt-10 space-y-3 text-left">
            {[
              "Track all your orders in one place",
              "Fast, secure checkout every time",
              "Exclusive member-only updates",
            ].map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-white/80">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Right: Form ── */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 bg-[#f8f8fb]">
        <div className="w-full max-w-md">
          {/* Logo (mobile only) */}
          <p className="lg:hidden text-2xl font-extrabold gradient-text mb-6 sm:mb-8 text-center">Shirt Bazaar.</p>

          <div className="card p-5 sm:p-8 shadow-card">
            {/* Title */}
            <div className="mb-5 sm:mb-7">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {isSignUp ? "Create an account" : "Welcome back"}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                {isSignUp
                  ? "Join us to manage your orders."
                  : "Sign in to continue to your account."}
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <span className="text-base">⚠️</span>
                {error}
              </div>
            )}

            {/* Success (email confirmation) */}
            {sent ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                <div className="text-4xl mb-3">📬</div>
                <p className="font-semibold text-emerald-800">Check your inbox!</p>
                <p className="mt-1.5 text-sm text-emerald-700">
                  We sent a confirmation link to <strong>{email}</strong>.
                </p>
              </div>
            ) : (
              <div>
                {/* 1-Click Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading || googleLoading}
                  className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-400 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
                >
                  {googleLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin text-slate-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Connecting to Google...</span>
                    </span>
                  ) : (
                    <>
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 font-semibold text-slate-400">
                      Or continue with email
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                      Email Address
                    </label>
                    <input
                      id="email"
                      required
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading || googleLoading}
                      className="input-base disabled:opacity-50"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        required
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading || googleLoading}
                        className="input-base pr-12 disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading || googleLoading}
                    className="btn-primary w-full py-3.5 mt-2 rounded-xl disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {isSignUp ? "Creating account…" : "Signing in…"}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {isSignUp ? "Create Account" : "Sign In with Email"}
                        <ArrowRight size={16} />
                      </span>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Toggle */}
            {!sent && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setError(null); setPassword(""); }}
                  className="text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors cursor-pointer"
                >
                  {isSignUp
                    ? "Already have an account? Sign in →"
                    : "Don't have an account? Create one →"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[calc(100vh-65px)]">
        <div className="text-sm text-slate-400 animate-pulse">Loading…</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
