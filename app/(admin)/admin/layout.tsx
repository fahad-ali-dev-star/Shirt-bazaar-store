"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Package, ShoppingBag, ExternalLink, LogOut, Image as ImageIcon, BarChart3, Megaphone } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  const navItems = [
    { href: "/admin", label: "Analytics", icon: <BarChart3 size={15} />, active: pathname === "/admin" },
    { href: "/admin/products", label: "Products", icon: <Package size={15} />, active: pathname.startsWith("/admin/products") },
    { href: "/admin/orders", label: "Orders", icon: <ShoppingBag size={15} />, active: pathname.startsWith("/admin/orders") },
    { href: "/admin/offers", label: "Offers & Promos", icon: <Megaphone size={15} />, active: pathname.startsWith("/admin/offers") },
    { href: "/admin/banner", label: "Hero Banner", icon: <ImageIcon size={15} />, active: pathname.startsWith("/admin/banner") },
  ];

  return (
    <div className="min-h-screen bg-[#f3f4f8] text-slate-900 flex flex-col font-sans">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 h-[56px] gap-4">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 font-extrabold text-slate-900 tracking-tight shrink-0"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white text-sm shadow-brand">
                👕
              </span>
              <span className="hidden sm:inline text-sm">Shirt Bazaar</span>
              <span className="rounded-md bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Admin
              </span>
            </Link>

            {/* Nav links */}
            <nav className="flex items-center gap-0.5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    item.active
                      ? "text-brand-700 bg-brand-50"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <span className={item.active ? "text-brand-500" : "text-slate-400"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {/* Active indicator */}
                  {item.active && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-500 rounded-full" />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
            >
              <span>Storefront</span>
              <ExternalLink size={12} className="text-slate-400" />
            </Link>

            <div className="h-4 w-px bg-slate-200" />

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
              title="Sign out"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
