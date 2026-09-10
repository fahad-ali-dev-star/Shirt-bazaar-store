import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { authorized } = await requireAdmin();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data, error } = await (supabase as any)
      .from("store_promos")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ promo: data || null });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { authorized } = await requireAdmin();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      is_active,
      badge_text,
      message,
      coupon_code,
      cta_text,
      cta_link,
      theme,
      can_dismiss,
    } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Promo message is required" }, { status: 400 });
    }

    const payload = {
      is_active: is_active ?? true,
      badge_text: badge_text?.trim() || null,
      message: message.trim(),
      coupon_code: coupon_code?.trim() ? coupon_code.trim().toUpperCase() : null,
      cta_text: cta_text?.trim() || null,
      cta_link: cta_link?.trim() || "/#products",
      theme: ["dark", "brand", "emerald", "amber", "purple", "crimson"].includes(theme)
        ? theme
        : "dark",
      can_dismiss: can_dismiss ?? true,
      updated_at: new Date().toISOString(),
    };

    const supabase = createAdminClient();
    let result;
    if (id) {
      result = await (supabase as any)
        .from("store_promos")
        .update(payload)
        .eq("id", id)
        .select()
        .maybeSingle();

      if (!result.error && !result.data) {
        result = await (supabase as any)
          .from("store_promos")
          .insert(payload)
          .select()
          .single();
      }
    } else {
      result = await (supabase as any)
        .from("store_promos")
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      console.error("Admin promo save error:", result.error);
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json({ promo: result.data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    console.error("Admin promo PUT exception:", err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
