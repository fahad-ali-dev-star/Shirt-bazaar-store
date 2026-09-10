"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";
import {
  Package,
  ShoppingBag,
  ExternalLink,
  LogOut,
  Image as ImageIcon,
  BarChart3,
  Megaphone,
  Menu,
  X,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  const navItems = [
    { href: "/admin", label: "Analytics", icon: <BarChart3 size={16} />, active: pathname === "/admin" },
    { href: "/admin/products", label: "Products", icon: <Package size={16} />, active: pathname.startsWith("/admin/products") },
    { href: "/admin/orders", label: "Orders", icon: <ShoppingBag size={16} />, active: pathname.startsWith("/admin/orders") },
    { href: "/admin/offers", label: "Offers & Promos", icon: <Megaphone size={16} />, active: pathname.startsWith("/admin/offers") },
    { href: "/admin/banner", label: "Hero Banner", icon: <ImageIcon size={16} />, active: pathname.startsWith("/admin/banner") },
  ];

  return (
    <div className="min-h-screen bg-[#f3f4f8] text-slate-900 flex flex-col font-sans">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3.5 sm:px-6 h-[56px] gap-2 sm:gap-4">
          {/* Left: Brand + Desktop Nav */}
          <div className="flex items-center gap-3 sm:gap-5 min-w-0">
            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0"
              aria-label="Toggle admin navigation menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            {/* Brand Logo */}
            <Link
              href="/admin"
              className="flex items-center gap-2 tracking-tight shrink-0 transition-transform hover:scale-105"
            >
              <Logo size="sm" showText={true} />
              <span className="rounded-md bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Admin
              </span>
            </Link>

            {/* Desktop Nav links */}
            <nav className="hidden md:flex items-center gap-0.5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 rounded-lg px-2.5 lg:px-3 py-1.5 text-xs lg:text-sm font-medium transition-colors ${
                    item.active
                      ? "text-brand-700 bg-brand-50 font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <span className={item.active ? "text-brand-500" : "text-slate-400"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.active && (
                    <span className="absolute bottom-0 left-2.5 right-2.5 h-0.5 bg-brand-500 rounded-full" />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs"
            >
              <span>Storefront</span>
              <ExternalLink size={12} className="text-slate-400" />
            </Link>

            <div className="hidden sm:block h-4 w-px bg-slate-200" />

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
              title="Sign out"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white/98 backdrop-blur-md px-4 py-3 shadow-lg animate-fade-in space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  item.active
                    ? "bg-brand-50 text-brand-700 font-semibold border border-brand-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={item.active ? "text-brand-600" : "text-slate-400"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.active && (
                  <span className="h-2 w-2 rounded-full bg-brand-600" />
                )}
              </Link>
            ))}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-1.5 py-2 text-slate-600 hover:text-slate-900 font-medium"
              >
                <span>View Storefront</span>
                <ExternalLink size={12} className="text-slate-400" />
              </Link>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 py-2 text-red-600 font-semibold hover:text-red-700"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 py-4 sm:py-8">
        <div className="mx-auto max-w-7xl px-3.5 sm:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
