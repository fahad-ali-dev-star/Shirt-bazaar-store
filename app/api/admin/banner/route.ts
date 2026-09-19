import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { invalidateCache } from "@/lib/redis";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("store_banners")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ banners: data || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { authorized } = await requireAdmin();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
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
      banner_height,
      image_fit,
    } = body;

    const payload = {
      media_type: media_type || "image",
      image_url: image_url || "/hero_banner.png",
      badge_text: badge_text || null,
      title: title || "New Season Drop",
      subtitle: subtitle || "Premium shirts crafted with care.",
      cta_text: cta_text || "Shop Now",
      cta_link: cta_link || "#products",
      secondary_cta_text: secondary_cta_text || null,
      secondary_cta_link: secondary_cta_link || null,
      overlay_opacity: typeof overlay_opacity === "number" ? overlay_opacity : 50,
      is_active: is_active ?? true,
      banner_height: banner_height || "tall",
      image_fit: image_fit || "cover",
      updated_at: new Date().toISOString(),
    };

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("store_banners")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    try {
      await invalidateCache("cache:store:banners");
      revalidatePath("/");
      revalidateTag("banners");
      revalidateTag("home-banner");
    } catch {}

    return NextResponse.json({ banner: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
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
      banner_height,
      image_fit,
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
      banner_height: banner_height || "tall",
      image_fit: image_fit || "cover",
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

    try {
      await invalidateCache("cache:store:banners");
      revalidatePath("/");
      revalidateTag("banners");
      revalidateTag("home-banner");
    } catch {}

    return NextResponse.json({ banner: result.data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { authorized } = await requireAdmin();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing banner ID" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("store_banners")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    try {
      await invalidateCache("cache:store:banners");
      revalidatePath("/");
      revalidateTag("banners");
      revalidateTag("home-banner");
    } catch {}

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
