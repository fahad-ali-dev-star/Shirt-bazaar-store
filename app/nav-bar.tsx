"use client";

import Link from "next/link";
import { useCart } from "@/lib/store/cart";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShoppingBag, User, ShieldCheck, Home, Menu, X } from "lucide-react";
import { AISearchBar } from "./components/ai-search-bar";
import { usePathname } from "next/navigation";

function NavLink({
  href,
  children,
  active,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`relative flex items-center gap-2 text-sm font-medium transition-colors group ${
        active ? "text-brand-600" : "text-slate-500 hover:text-slate-900"
      } ${className}`}
    >
      {children}
      {/* Animated underline */}
      <span
        className={`absolute -bottom-1 left-0 h-px bg-brand-600 transition-all duration-300 ${
          active ? "w-full" : "w-0 group-hover:w-full"
        }`}
      />
    </Link>
  );
}

export function NavBar() {
  const count = useCart((s) => s.count());
  const [mounted, setMounted] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session?.user);
    });

    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const isHome = pathname === "/";
  const isCart = pathname === "/cart";
  const isAccount = pathname === "/account" || pathname === "/login";

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass shadow-sm"
          : "bg-white/70 backdrop-blur-md border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 gap-4">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex-shrink-0 font-display text-xl font-extrabold tracking-tight transition-transform hover:scale-105"
        >
          <span className="gradient-text">Shirt Bazaar.</span>
        </Link>

        {/* Search (desktop) */}
        <div className="hidden md:flex flex-1 justify-center max-w-md">
          <AISearchBar />
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-5 flex-shrink-0">
          <NavLink href="/" active={isHome}>
            <Home size={16} />
            <span>Home</span>
          </NavLink>

          <NavLink href="/admin/login">
            <ShieldCheck size={16} />
            <span>Admin</span>
          </NavLink>

          {/* Cart */}
          <Link
            href="/cart"
            className={`relative flex items-center gap-2 text-sm font-medium transition-colors group ${
              isCart ? "text-brand-600" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShoppingBag size={18} />
            <span>Cart</span>
            {mounted && count > 0 && (
              <span className="absolute -top-2.5 -right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white shadow-brand animate-bounce-in">
                {count}
              </span>
            )}
            <span
              className={`absolute -bottom-1 left-0 h-px bg-brand-600 transition-all duration-300 ${
                isCart ? "w-full" : "w-0 group-hover:w-full"
              }`}
            />
          </Link>

          {/* Account / Sign in */}
          {mounted && (
            <Link
              href={signedIn ? "/account" : "/login"}
              className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all ${
                isAccount
                  ? "bg-brand-600 text-white shadow-brand"
                  : "bg-slate-100 text-slate-700 hover:bg-brand-50 hover:text-brand-700"
              }`}
            >
              <User size={15} />
              <span>{signedIn ? "My Orders" : "Sign In"}</span>
            </Link>
          )}
        </div>

        {/* Mobile: cart + hamburger */}
        <div className="flex md:hidden items-center gap-3">
          <Link
            href="/cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors"
          >
            <ShoppingBag size={18} />
            {mounted && count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white shadow-xs animate-bounce-in">
                {count}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
              isMobileMenuOpen
                ? "bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/20"
                : "bg-slate-100 text-slate-800 hover:bg-slate-200"
            }`}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Backdrop Dimmer */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 top-[57px] bg-slate-950/40 backdrop-blur-xs z-40 md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-5 py-5 flex flex-col gap-4 animate-slide-down absolute top-full left-0 right-0 z-50 shadow-2xl">
          <div className="w-full">
            <AISearchBar />
          </div>

          <div className="flex flex-col gap-2 pt-1">
            {[
              { href: "/", label: "Home", icon: <Home size={18} className="text-brand-600" /> },
              { href: "/admin/login", label: "Admin Dashboard", icon: <ShieldCheck size={18} className="text-slate-500" /> },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">→</span>
              </Link>
            ))}

            {mounted && (
              <Link
                href={signedIn ? "/account" : "/login"}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-xs ${
                  signedIn
                    ? "bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100"
                    : "bg-slate-900 border border-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <User size={18} className={signedIn ? "text-brand-600" : "text-slate-300"} />
                  <span>{signedIn ? "My Orders & Account" : "Sign In to Account"}</span>
                </div>
                <span className={`text-xs ${signedIn ? "text-brand-400" : "text-slate-400"} font-mono`}>
                  →
                </span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
