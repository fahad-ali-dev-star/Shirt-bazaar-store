import { NextRequest, NextResponse } from "next/server";
import { logServerError } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";
import { parseJsonObject, validateProductInput } from "@/lib/validation";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    const { authorized } = await requireAdmin();
    if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createAdminClient();
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, slug, base_price, category, is_active, created_at, product_variants(id, size, color, sku, stock_qty, price_override), product_images(url, position)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
    return NextResponse.json({ products });
  } catch (err) {
    logServerError("Admin product request failed", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { authorized } = await requireAdmin();
    if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const contentLength = Number(req.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > 200_000) {
      return NextResponse.json({ error: "Request is too large" }, { status: 413 });
    }
    let body: unknown;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const payload = parseJsonObject(body);
    const result = validateProductInput(payload, false);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    const { name, slug, description, base_price, category, variants, images } = result.value;
    if (!slug) return NextResponse.json({ error: "Invalid product slug" }, { status: 400 });

    const supabase = createAdminClient();

    const { data: product, error } = await supabase
      .from("products")
      .insert({ name, slug, description, base_price, category, is_active: true })
      .select()
      .single();

    if (error) return NextResponse.json({ error: "Failed to create product" }, { status: 500 });

    if (variants?.length) {
      const { error: variantError } = await supabase.from("product_variants").insert(
        variants.map((v) => {
          const generatedSku = v.sku?.trim() || `${slug}-${v.size || "ALL"}-${v.color || "ALL"}-${randomUUID().slice(0, 8)}`.toUpperCase();
          return {
            product_id: product.id,
            size: v.size || "M",
            color: v.color || "Black",
            sku: generatedSku,
            stock_qty: v.stock_qty ?? 0,
            price_override: v.price_override ?? null,
          };
        })
      );
      if (variantError) {
        return NextResponse.json({ error: "Failed to create product variants" }, { status: 500 });
      }
    }

    if (images?.length) {
      const { error: imgError } = await supabase.from("product_images").insert(
        images.map((url, index) => ({
          product_id: product.id,
          url,
          position: index,
        }))
      );
      if (imgError) {
        return NextResponse.json({ error: "Failed to create product images" }, { status: 500 });
      }
    }

    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/");
    } catch {}

    return NextResponse.json({ product });
  } catch (err) {
    logServerError("Admin product request failed", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
