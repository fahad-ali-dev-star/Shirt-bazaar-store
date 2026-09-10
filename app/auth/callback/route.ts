import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";
  const isAdminRoute = next.startsWith("/admin");
  const errorPage = isAdminRoute ? "/admin/login" : "/login";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (isAdminRoute) {
        const adminEmails = (process.env.ADMIN_EMAILS ?? "")
          .split(",")
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean);

        const isAdmin = !!user?.email && adminEmails.includes(user.email.toLowerCase());

        if (isAdmin) {
          return NextResponse.redirect(`${origin}${next}`);
        } else {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/admin/login?error=unauthorized`);
        }
      }

      // Customer login — no allow-list check, just redirect
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}${errorPage}?error=auth_failed`);
}
