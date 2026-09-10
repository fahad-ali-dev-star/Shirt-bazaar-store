import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("store_banners")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ banner: data || null });
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
      media_type,
      image_url,
      badge_text,
      title,
      subtitle,
      cta_text,
      cta_link,
      secondary_cta_text,
      secondary_cta_link,
      overlay_opacity,
      is_active,
    } = body;

    const payload = {
      media_type: media_type || "image",
      image_url: image_url || null,
      badge_text: badge_text || null,
      title: title || "Essentials, Elevated.",
      subtitle: subtitle || "",
      cta_text: cta_text || "Shop Collection",
      cta_link: cta_link || "#products",
      secondary_cta_text: secondary_cta_text || null,
      secondary_cta_link: secondary_cta_link || null,
      overlay_opacity: typeof overlay_opacity === "number" ? overlay_opacity : 50,
      is_active: is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    const supabase = createAdminClient();
    let result;
    if (id) {
      result = await supabase
        .from("store_banners")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("store_banners")
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json({ banner: result.data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
