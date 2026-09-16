import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

export const revalidate = 30; // 30 seconds edge caching

export async function GET() {
  try {
    const supabase = createPublicClient();
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, slug, base_price, category, created_at, product_images(url, position)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(6);

    if (error || !products || products.length === 0) {
      return NextResponse.json({ latestProduct: null, newProducts: [] });
    }

    const formatted = products.map((p) => {
      const rawImages = (Array.isArray(p.product_images) ? p.product_images : []) as {
        url: string;
        position: number;
      }[];
      const sortedImages = rawImages.slice().sort((a, b) => a.position - b.position);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        base_price: p.base_price,
        category: p.category,
        created_at: p.created_at,
        image_url: sortedImages[0]?.url || "/logo.svg",
      };
    });

    return NextResponse.json({
      latestProduct: formatted[0] || null,
      newProducts: formatted,
    });
  } catch {
    return NextResponse.json({ latestProduct: null, newProducts: [] });
  }
}
